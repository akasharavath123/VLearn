const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Video = require('../models/Video');
const Quiz = require('../models/Quiz');
const Assignment = require('../models/Assignment');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/role');

// GET /api/courses - List courses with search & filters
router.get('/', async (req, res) => {
  try {
    const { q, category, level } = req.query;
    const filter = { isPublished: true };

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (level && level !== 'All Levels') {
      filter.level = level;
    }

    let courses = await Course.find(filter)
      .populate('instructor', 'name bio')
      .sort({ createdAt: -1 });

    if (q) {
      const term = q.toLowerCase();
      courses = courses.filter(
        c =>
          c.title.toLowerCase().includes(term) ||
          c.description.toLowerCase().includes(term) ||
          (c.instructorName && c.instructorName.toLowerCase().includes(term))
      );
    }

    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/courses/instructor/mine - Courses created by current instructor
router.get('/instructor/mine', authMiddleware, requireRole('instructor'), async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id }).sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/courses/:id - Course detail with curriculum items
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('instructor', 'name bio');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const videos = await Video.find({ course: course._id }).sort({ order: 1 });
    const quizzes = await Quiz.find({ course: course._id }).select('title timeLimit passingScore questions');
    const assignments = await Assignment.find({ course: course._id });

    res.json({
      course,
      videos,
      quizzes,
      assignments
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/courses - Create course (Instructor only)
router.post('/', authMiddleware, requireRole('instructor'), async (req, res) => {
  try {
    const { title, description, category, level, price, isPaid, thumbnail, tags } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }

    const newCourse = new Course({
      title,
      description,
      instructor: req.user._id,
      instructorName: req.user.name,
      category: category || 'Development',
      level: level || 'Beginner',
      price: isPaid ? Number(price) || 499 : 0,
      isPaid: Boolean(isPaid && Number(price) > 0),
      thumbnail: thumbnail || '',
      tags: tags || [],
      isPublished: true
    });

    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/courses/:id - Edit course (Instructor only)
router.put('/:id', authMiddleware, requireRole('instructor'), async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, instructor: req.user._id });
    if (!course) {
      return res.status(404).json({ message: 'Course not found or unauthorized.' });
    }

    const updates = req.body;
    if (updates.price !== undefined) {
      course.price = updates.isPaid ? Number(updates.price) || 0 : 0;
      course.isPaid = Boolean(updates.isPaid && course.price > 0);
    }
    ['title', 'description', 'category', 'level', 'thumbnail', 'isPublished'].forEach(f => {
      if (updates[f] !== undefined) course[f] = updates[f];
    });

    course.updatedAt = Date.now();
    await course.save();
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/courses/:id (Instructor only)
router.delete('/:id', authMiddleware, requireRole('instructor'), async (req, res) => {
  try {
    const course = await Course.findOneAndDelete({ _id: req.params.id, instructor: req.user._id });
    if (!course) {
      return res.status(404).json({ message: 'Course not found or unauthorized.' });
    }
    // Clean up associated videos, quizzes, assignments
    await Video.deleteMany({ course: course._id });
    await Quiz.deleteMany({ course: course._id });
    await Assignment.deleteMany({ course: course._id });

    res.json({ message: 'Course and contents deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

