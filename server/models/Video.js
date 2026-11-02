const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  url: { type: String, required: true }, // Can be uploaded file /uploads/... or external video URL (YouTube, MP4, etc.)
  duration: { type: String, default: '10:00' },
  order: { type: Number, default: 1 },
  isFreePreview: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Video', videoSchema);

