const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Video = require('../models/Video');
const Course = require('../models/Course');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/role');

// Multer storage for uploaded video files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${Date.now()}_${safeName}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB
});

// GET /api/videos/course/:courseId - Get all lessons for a course
router.get('/course/:courseId', authMiddleware, async (req, res) => {
  try {
    const videos = await Video.find({ course: req.params.courseId }).sort({ order: 1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/videos - Add a video / class (file upload or URL)
router.post('/upload', authMiddleware, requireRole('instructor'), upload.single('videoFile'), async (req, res) => {
  try {
    const { courseId, title, description, url, duration, order, isFreePreview } = req.body;

    if (!courseId || !title) {
      return res.status(400).json({ message: 'courseId and title are required.' });
    }

    const course = await Course.findOne({ _id: courseId, instructor: req.user._id });
    if (!course) {
      return res.status(403).json({ message: 'You do not own this course.' });
    }

    let videoUrl = url;
    if (req.file) {
      videoUrl = `/uploads/${req.file.filename}`;
    }

    if (!videoUrl) {
      videoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4'; // fallback sample video
    }

    // Determine order
    let videoOrder = Number(order);
    if (!videoOrder) {
      const count = await Video.countDocuments({ course: courseId });
      videoOrder = count + 1;
    }

    const video = new Video({
      title,
      description: description || '',
      course: courseId,
      url: videoUrl,
      duration: duration || '12:00',
      order: videoOrder,
      isFreePreview: Boolean(isFreePreview)
    });

    await video.save();
    res.status(201).json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/videos/:id (Instructor only)
router.delete('/:id', authMiddleware, requireRole('instructor'), async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found.' });

    const course = await Course.findOne({ _id: video.course, instructor: req.user._id });
    if (!course) return res.status(403).json({ message: 'Unauthorized.' });

    await Video.findByIdAndDelete(req.params.id);
    res.json({ message: 'Video removed.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

