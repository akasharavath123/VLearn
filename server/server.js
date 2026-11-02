const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const Course = require('./models/Course');
const Video = require('./models/Video');
const Quiz = require('./models/Quiz');
const Assignment = require('./models/Assignment');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/doubts', require('./routes/doubts'));
app.use('/api/discussions', require('./routes/discussions'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/payments', require('./routes/payments'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'VLearn server is running with all learning & RuPay services!',
    timestamp: new Date()
  });
});

app.get('/', (req, res) => {
  res.send('Welcome to VLearn API Server (Express + MongoDB)');
});

// Seed sample courses and lectures if collection is empty
async function seedInitialData() {
  try {
    const count = await Course.countDocuments();
    if (count > 0) return;

    console.log('Seeding initial VLearn courses...');

    // Create a mock instructor if not present
    const User = require('./models/User');
    let instructor = await User.findOne({ role: 'instructor' });
    if (!instructor) {
      instructor = new User({
        name: 'Dr. Akash Raj',
        email: 'instructor@vlearn.edu',
        password: 'password123',
        role: 'instructor',
        bio: 'Senior Full Stack & AI Developer and Educator'
      });
      await instructor.save();
    }

    const c1 = new Course({
      title: 'Full Stack Web Development with React & Node',
      description: 'Master frontend and backend with modern React, Express, MongoDB, REST APIs, and responsive design.',
      instructor: instructor._id,
      instructorName: instructor.name,
      category: 'Development',
      level: 'Beginner',
      price: 499,
      isPaid: true,
      isPublished: true,
      rating: 4.9,
      totalStudents: 340
    });
    await c1.save();

    const c2 = new Course({
      title: 'UI/UX Design Masterclass & Figma Prototyping',
      description: 'Learn wireframing, color psychology, design systems, and building interactive prototypes in Figma.',
      instructor: instructor._id,
      instructorName: instructor.name,
      category: 'Design',
      level: 'Intermediate',
      price: 299,
      isPaid: true,
      isPublished: true,
      rating: 4.8,
      totalStudents: 180
    });
    await c2.save();

    const c3 = new Course({
      title: 'Python for Beginners & Data Science Basics',
      description: 'Start programming with Python: variables, loops, data structures, and NumPy/Pandas essentials.',
      instructor: instructor._id,
      instructorName: instructor.name,
      category: 'Data Science',
      level: 'Beginner',
      price: 0,
      isPaid: false,
      isPublished: true,
      rating: 4.7,
      totalStudents: 520
    });
    await c3.save();

    // Add videos to c1
    const v1 = new Video({
      title: '1. Introduction to Web Development Architecture',
      description: 'Overview of Client-Server model, HTTP protocol, and modern browser rendering engines.',
      course: c1._id,
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      duration: '14:20',
      order: 1,
      isFreePreview: true
    });
    await v1.save();

    const v2 = new Video({
      title: '2. React Components, Props and State',
      description: 'Deep dive into JSX, functional components, useState hook, and unidirectional data flow.',
      course: c1._id,
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      duration: '22:15',
      order: 2,
      isFreePreview: false
    });
    await v2.save();

    const v3 = new Video({
      title: '3. Connecting Express Backend & RESTful APIs',
      description: 'Building Express routes, connecting MongoDB with Mongoose, and handling asynchronous requests.',
      course: c1._id,
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      duration: '18:40',
      order: 3,
      isFreePreview: false
    });
    await v3.save();

    // Add Quiz to c1
    const q1 = new Quiz({
      title: 'React & Web Architecture Fundamentals Quiz',
      course: c1._id,
      instructor: instructor._id,
      passingScore: 60,
      timeLimit: 15,
      questions: [
        {
          question: 'What is the Virtual DOM in React?',
          options: [
            'A direct copy of the HTML DOM in the browser',
            'A lightweight in-memory representation of the real DOM',
            'A database engine for React state',
            'A server-side cache for HTTP requests'
          ],
          correctIndex: 1,
          explanation: 'The Virtual DOM is a lightweight Javascript object representing the real DOM, enabling fast reconciliation.'
        },
        {
          question: 'Which HTTP method is idempotent and primarily used to update an entire resource?',
          options: ['POST', 'GET', 'PUT', 'DELETE'],
          correctIndex: 2,
          explanation: 'PUT is idempotent and replaces the entire target resource with request payload.'
        },
        {
          question: 'Which React hook is used to run side-effects like data fetching or DOM subscriptions?',
          options: ['useState', 'useContext', 'useEffect', 'useReducer'],
          correctIndex: 2,
          explanation: 'useEffect is specifically designed for side-effects in React functional components.'
        }
      ]
    });
    await q1.save();

    // Add Assignment to c1
    const a1 = new Assignment({
      title: 'Assignment 1: Build a Responsive Product Showcase Card',
      description: 'Create a responsive card component using React and CSS Flexbox/Grid with hover states and buy button.',
      course: c1._id,
      instructor: instructor._id,
      maxScore: 100,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      instructions: 'Submit either your GitHub repository link or a CodeSandbox URL along with a short summary.'
    });
    await a1.save();

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Seeding error (non-fatal):', err.message);
  }
}

// Connect to MongoDB and start server
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully!');
    await seedInitialData();

    app.listen(PORT, () => {
      console.log(`VLearn server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    // Don't exit process so app stays alive even if network/mongo timeout happens
    app.listen(PORT, () => {
      console.log(`VLearn server running in standalone mode at http://localhost:${PORT}`);
    });
  }
}

startServer();
