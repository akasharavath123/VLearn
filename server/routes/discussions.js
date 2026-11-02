const express = require('express');
const router = express.Router();
const Discussion = require('../models/Discussion');
const authMiddleware = require('../middleware/auth');

// GET /api/discussions/course/:courseId - Peer to peer forum threads
router.get('/course/:courseId', authMiddleware, async (req, res) => {
  try {
    const discussions = await Discussion.find({ course: req.params.courseId })
      .populate('author', 'name role avatar')
      .populate('replies.author', 'name role avatar')
      .sort({ isPinned: -1, createdAt: -1 });

    res.json(discussions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/discussions - Post peer discussion thread
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { courseId, title, body } = req.body;
    if (!courseId || !title || !body) {
      return res.status(400).json({ message: 'courseId, title, and body are required.' });
    }

    const disc = new Discussion({
      course: courseId,
      author: req.user._id,
      authorName: req.user.name,
      authorRole: req.user.role,
      title,
      body
    });

    await disc.save();
    res.status(201).json(disc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/discussions/:id/reply - Peer reply to discussion
router.post('/:id/reply', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Reply text is required.' });
    }

    const disc = await Discussion.findById(req.params.id);
    if (!disc) return res.status(404).json({ message: 'Discussion not found' });

    disc.replies.push({
      author: req.user._id,
      authorName: req.user.name,
      authorRole: req.user.role,
      text: text.trim(),
      createdAt: new Date()
    });

    await disc.save();
    res.json(disc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/discussions/:id/like - Like/unlike peer post
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const disc = await Discussion.findById(req.params.id);
    if (!disc) return res.status(404).json({ message: 'Discussion not found' });

    const userIdStr = req.user._id.toString();
    const alreadyLiked = disc.likes.some(id => id.toString() === userIdStr);

    if (alreadyLiked) {
      disc.likes = disc.likes.filter(id => id.toString() !== userIdStr);
    } else {
      disc.likes.push(req.user._id);
    }

    await disc.save();
    res.json({ likesCount: disc.likes.length, liked: !alreadyLiked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

