import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { apiRequest } from "../api";
import "../styles/Dashboard.css";
import "../styles/Instructor.css";

function InstructorDashboard({ user, onLogout }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInstructorCourses() {
      setLoading(true);
      const res = await apiRequest("/api/courses/instructor/mine");
      if (res.ok && Array.isArray(res.data)) {
        setCourses(res.data);
      } else {
        // Fallback default sample course for offline/preview
        const saved = localStorage.getItem("vlearn_instructor_courses");
        if (saved) {
          setCourses(JSON.parse(saved));
        } else {
          setCourses([
            {
              _id: "demo_course_1",
              title: "Full Stack Web Development with React & Node",
              category: "Development",
              level: "Beginner",
              price: 499,
              isPaid: true,
              totalStudents: 340,
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      }
      setLoading(false);
    }
    loadInstructorCourses();
  }, []);

  const totalStudents = courses.reduce((acc, c) => acc + (c.totalStudents || 0), 0);

  return (
    <div className="app">
      <Navbar user={user} onLogout={onLogout} />

      <main className="dashboard-page instructor-studio">
        {/* Header */}
        <div className="dash-welcome">
          <div>
            <span className="hero-label">INSTRUCTOR STUDIO</span>
            <h1>
              Welcome, <span>{user?.name || "Instructor"}</span>
            </h1>
            <p>Upload classes, manage quizzes, review assignments, and answer doubts.</p>
          </div>

          <Link to="/instructor/course/new" className="primary-btn dash-explore-btn">
            + Create New Course
          </Link>
        </div>

        {/* Studio Stats */}
        <div className="dash-stats">
          <div className="dash-stat-card">
            <div className="dash-stat-icon">📚</div>
            <div>
              <strong>{courses.length}</strong>
              <span>Active Courses</span>
            </div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-icon">👥</div>
            <div>
              <strong>{totalStudents}</strong>
              <span>Enrolled Students</span>
            </div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-icon">💳</div>
            <div>
              <strong>RuPay / UPI</strong>
              <span>Payment Enabled</span>
            </div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-icon">💬</div>
            <div>
              <strong>Instant</strong>
              <span>Student Doubts Hub</span>
            </div>
          </div>
        </div>

        {/* Courses Section */}
        <section className="instructor-courses-section">
          <div className="section-row-header">
            <h2>Your Teaching Catalog</h2>
            <span className="badge-count">{courses.length} Courses</span>
          </div>

          {loading ? (
            <div className="empty-courses">
              <p>Loading your courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="empty-courses">
              <h3>You have not created any courses yet.</h3>
              <p>Publish your first video course and share knowledge with students worldwide.</p>
              <Link to="/instructor/course/new" className="primary-btn" style={{ marginTop: "16px", display: "inline-block" }}>
                Create First Course
              </Link>
            </div>
          ) : (
            <div className="instructor-courses-grid">
              {courses.map((course) => (
                <div key={course._id} className="instructor-course-card">
                  <div className="ic-header">
                    <span className="ic-category">{course.category || "Development"}</span>
                    <span className={`ic-pricing ${course.isPaid ? "ic-paid" : "ic-free"}`}>
                      {course.isPaid ? `₹${course.price} (RuPay)` : "Free"}
                    </span>
                  </div>

                  <h3 className="ic-title">{course.title}</h3>
                  <p className="ic-stats">
                    👥 {course.totalStudents || 0} students enrolled · {course.level || "Beginner"}
                  </p>

                  <div className="ic-actions-grid">
                    <Link
                      to={`/instructor/course/${course._id}/upload`}
                      className="ic-btn ic-btn-primary"
                    >
                      📹 Upload Classes
                    </Link>
                    <Link
                      to={`/instructor/course/${course._id}/quizzes`}
                      className="ic-btn ic-btn-secondary"
                    >
                      📝 Add Quizzes
                    </Link>
                    <Link
                      to={`/instructor/course/${course._id}/assignments`}
                      className="ic-btn ic-btn-secondary"
                    >
                      📋 Assignments
                    </Link>
                    <Link
                      to={`/doubts/${course._id}`}
                      className="ic-btn ic-btn-accent"
                    >
                      💬 Answer Doubts
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default InstructorDashboard;

