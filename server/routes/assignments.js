const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Course = require('../models/Course');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/role');

// GET /api/assignments/course/:courseId
router.get('/course/:courseId', authMiddleware, async (req, res) => {
  try {
    const assignments = await Assignment.find({ course: req.params.courseId }).sort({ createdAt: -1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/assignments/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    let mySubmission = null;
    if (req.user.role === 'student') {
      mySubmission = await Submission.findOne({
        student: req.user._id,
        refId: assignment._id,
        type: 'assignment'
      });
    }

    res.json({ assignment, mySubmission });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/assignments - Create Assignment (Instructor)
router.post('/', authMiddleware, requireRole('instructor'), async (req, res) => {
  try {
    const { title, description, courseId, dueDate, maxScore, instructions } = req.body;
    if (!title || !description || !courseId) {
      return res.status(400).json({ message: 'Title, description, and courseId required.' });
    }

    const course = await Course.findOne({ _id: courseId, instructor: req.user._id });
    if (!course) return res.status(403).json({ message: 'Unauthorized course.' });

    const assignment = new Assignment({
      title,
      description,
      course: courseId,
      instructor: req.user._id,
      dueDate: dueDate ? new Date(dueDate) : null,
      maxScore: Number(maxScore) || 100,
      instructions: instructions || ''
    });

    await assignment.save();
    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/assignments/:id/submit - Student submits assignment
router.post('/:id/submit', authMiddleware, requireRole('student'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found.' });

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Submission content is required.' });
    }

    let submission = await Submission.findOne({
      student: req.user._id,
      refId: assignment._id,
      type: 'assignment'
    });

    if (submission) {
      submission.content = content;
      submission.submittedAt = Date.now();
      await submission.save();
    } else {
      submission = new Submission({
        student: req.user._id,
        course: assignment.course,
        type: 'assignment',
        refId: assignment._id,
        content
      });
      await submission.save();
    }

    res.status(201).json({ success: true, submission });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/assignments/:id/submissions - Instructor views student submissions
router.get('/:id/submissions', authMiddleware, requireRole('instructor'), async (req, res) => {
  try {
    const submissions = await Submission.find({
      refId: req.params.id,
      type: 'assignment'
    }).populate('student', 'name email avatar');

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/assignments/submissions/:subId/grade - Instructor grades submission
router.put('/submissions/:subId/grade', authMiddleware, requireRole('instructor'), async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    const sub = await Submission.findById(req.params.subId);
    if (!sub) return res.status(404).json({ message: 'Submission not found' });

    sub.grade = Number(grade);
    sub.instructorFeedback = feedback || '';
    await sub.save();

    res.json({ success: true, submission: sub });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/assignments/:id
router.delete('/:id', authMiddleware, requireRole('instructor'), async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    await Submission.deleteMany({ refId: req.params.id });
    res.json({ message: 'Assignment deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

