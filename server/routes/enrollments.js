const express = require('express');
const router = express.Router();
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Video = require('../models/Video');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/role');

// GET /api/enrollments/mine - Get enrolled courses for student
router.get('/mine', authMiddleware, requireRole('student'), async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate('course')
      .sort({ enrolledAt: -1 });

    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/enrollments/check/:courseId
router.get('/check/:courseId', authMiddleware, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: req.params.courseId
    });
    res.json({ isEnrolled: !!enrollment, enrollment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/enrollments/free/:courseId - Free course instant enrollment
router.post('/free/:courseId', authMiddleware, requireRole('student'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (course.isPaid && course.price > 0) {
      return res.status(400).json({ message: 'This is a paid course. RuPay or card payment required.' });
    }

    let enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: course._id
    });

    if (enrollment) {
      return res.json({ message: 'Already enrolled.', enrollment });
    }

    enrollment = new Enrollment({
      student: req.user._id,
      course: course._id
    });

    await enrollment.save();
    course.totalStudents = (course.totalStudents || 0) + 1;
    await course.save();

    res.status(201).json({ success: true, message: 'Enrolled successfully!', enrollment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/enrollments/:courseId/progress - Mark lesson watched
router.put('/:courseId/progress', authMiddleware, requireRole('student'), async (req, res) => {
  try {
    const { videoId } = req.body;
    let enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: req.params.courseId
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment record not found.' });
    }

    if (videoId && !enrollment.completedVideos.includes(videoId)) {
      enrollment.completedVideos.push(videoId);
    }

    const totalVideos = await Video.countDocuments({ course: req.params.courseId });
    if (totalVideos > 0) {
      enrollment.progressPercent = Math.min(
        100,
        Math.round((enrollment.completedVideos.length / totalVideos) * 100)
      );
    } else {
      enrollment.progressPercent = 100;
    }

    if (enrollment.progressPercent >= 100) {
      enrollment.isCompleted = true;
      enrollment.completedAt = new Date();
    }

    await enrollment.save();
    res.json({ success: true, enrollment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

