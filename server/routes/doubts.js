const express = require('express');
const router = express.Router();
const Doubt = require('../models/Doubt');
const Course = require('../models/Course');
const authMiddleware = require('../middleware/auth');

// GET /api/doubts/course/:courseId - Get all doubts for a course
router.get('/course/:courseId', authMiddleware, async (req, res) => {
  try {
    const doubts = await Doubt.find({ course: req.params.courseId })
      .populate('student', 'name avatar')
      .populate('replies.author', 'name role avatar')
      .sort({ createdAt: -1 });

    res.json(doubts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/doubts - Student asks doubt to instructor
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { courseId, question, details, videoId, videoTitle } = req.body;
    if (!courseId || !question) {
      return res.status(400).json({ message: 'courseId and question are required.' });
    }

    const doubt = new Doubt({
      question,
      details: details || '',
      student: req.user._id,
      studentName: req.user.name,
      course: courseId,
      video: videoId || null,
      videoTitle: videoTitle || ''
    });

    await doubt.save();
    res.status(201).json(doubt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/doubts/:id/reply - Instructor or student replies to doubt
router.post('/:id/reply', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Reply text is required.' });
    }

    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ message: 'Doubt not found.' });

    doubt.replies.push({
      author: req.user._id,
      authorName: req.user.name,
      authorRole: req.user.role,
      text: text.trim(),
      createdAt: new Date()
    });

    await doubt.save();
    res.json(doubt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/doubts/:id/resolve - Mark doubt resolved
router.put('/:id/resolve', authMiddleware, async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ message: 'Doubt not found.' });

    doubt.isResolved = !doubt.isResolved;
    await doubt.save();

    res.json(doubt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

