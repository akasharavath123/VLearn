import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Dashboard from "./pages/Dashboard";
import InstructorDashboard from "./pages/InstructorDashboard";
import CourseEditor from "./pages/CourseEditor";
import UploadClass from "./pages/UploadClass";
import ManageQuizzes from "./pages/ManageQuizzes";
import ManageAssignments from "./pages/ManageAssignments";
import VideoPlayer from "./pages/VideoPlayer";
import QuizPage from "./pages/QuizPage";
import AssignmentPage from "./pages/AssignmentPage";
import DoubtsPage from "./pages/DoubtsPage";
import PeerDiscussion from "./pages/PeerDiscussion";
import PaymentPage from "./pages/PaymentPage";
import NotFound from "./pages/NotFound";

import { getStoredUser, setStoredAuth } from "./api";

function PrivateRoute({ user, children, requiredRole }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === "instructor" ? "/instructor" : "/dashboard"} replace />;
  }
  return children;
}

function App() {
  const [user, setUser] = useState(getStoredUser);

  useEffect(() => {
    // Keep user state synced with localStorage
    const stored = getStoredUser();
    if (stored && JSON.stringify(stored) !== JSON.stringify(user)) {
      setUser(stored);
    }
  }, []);

  function handleLogin(userData, token) {
    setUser(userData);
    setStoredAuth(userData, token);
  }

  function handleLogout() {
    setUser(null);
    setStoredAuth(null, null);
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home user={user} onLogout={handleLogout} />} />
        <Route path="/courses" element={<Courses user={user} onLogout={handleLogout} />} />
        <Route path="/courses/:id" element={<CourseDetail user={user} onLogout={handleLogout} />} />

        {/* Auth Routes */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={user.role === "instructor" ? "/instructor" : "/dashboard"} replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/signup"
          element={
            user ? (
              <Navigate to={user.role === "instructor" ? "/instructor" : "/dashboard"} replace />
            ) : (
              <Signup onLogin={handleLogin} />
            )
          }
        />

        {/* RuPay Payment Checkout */}
        <Route
          path="/payment/:courseId"
          element={
            <PrivateRoute user={user}>
              <PaymentPage user={user} onLogout={handleLogout} />
            </PrivateRoute>
          }
        />

        {/* Student Classroom & Watching Classes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute user={user}>
              <Dashboard user={user} onLogout={handleLogout} />
            </PrivateRoute>
          }
        />
        <Route
          path="/learn/:courseId"
          element={
            <PrivateRoute user={user}>
              <VideoPlayer user={user} onLogout={handleLogout} />
            </PrivateRoute>
          }
        />
        <Route
          path="/quiz/:id"
          element={
            <PrivateRoute user={user}>
              <QuizPage user={user} onLogout={handleLogout} />
            </PrivateRoute>
          }
        />
        <Route
          path="/assignment/:id"
          element={
            <PrivateRoute user={user}>
              <AssignmentPage user={user} onLogout={handleLogout} />
            </PrivateRoute>
          }
        />
        <Route
          path="/doubts/:courseId"
          element={
            <PrivateRoute user={user}>
              <DoubtsPage user={user} onLogout={handleLogout} />
            </PrivateRoute>
          }
        />
        <Route
          path="/discuss/:courseId"
          element={
            <PrivateRoute user={user}>
              <PeerDiscussion user={user} onLogout={handleLogout} />
            </PrivateRoute>
          }
        />

        {/* Instructor Studio Routes */}
        <Route
          path="/instructor"
          element={
            <PrivateRoute user={user} requiredRole="instructor">
              <InstructorDashboard user={user} onLogout={handleLogout} />
            </PrivateRoute>
          }
        />
        <Route
          path="/instructor/course/new"
          element={
            <PrivateRoute user={user} requiredRole="instructor">
              <CourseEditor user={user} onLogout={handleLogout} />
            </PrivateRoute>
          }
        />
        <Route
          path="/instructor/course/:id/upload"
          element={
            <PrivateRoute user={user} requiredRole="instructor">
              <UploadClass user={user} onLogout={handleLogout} />
            </PrivateRoute>
          }
        />
        <Route
          path="/instructor/course/:id/quizzes"
          element={
            <PrivateRoute user={user} requiredRole="instructor">
              <ManageQuizzes user={user} onLogout={handleLogout} />
            </PrivateRoute>
          }
        />
        <Route
          path="/instructor/course/:id/assignments"
          element={
            <PrivateRoute user={user} requiredRole="instructor">
              <ManageAssignments user={user} onLogout={handleLogout} />
            </PrivateRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound user={user} onLogout={handleLogout} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
