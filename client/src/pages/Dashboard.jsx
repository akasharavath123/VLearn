import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { apiRequest } from "../api";
import "../styles/Dashboard.css";

function ProgressRing({ pct }) {
  return (
    <div className="progress-ring-wrap">
      <div
        className="progress-ring"
        style={{ "--pct": pct }}
        aria-label={`${pct}% complete`}
      >
        <span>{pct}%</span>
      </div>
    </div>
  );
}

function Dashboard({ user, onLogout }) {
  // If user is instructor, redirect to their studio
  if (user?.role === "instructor") {
    return <Navigate to="/instructor" replace />;
  }

  const [enrolledList, setEnrolledList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudentCourses() {
      setLoading(true);
      const res = await apiRequest("/api/enrollments/mine");
      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        setEnrolledList(
          res.data.map((enr) => ({
            id: enr.course?._id || enr._id,
            title: enr.course?.title || "Full Stack Course",
            progress: enr.progressPercent || 0,
            instructor: enr.course?.instructorName || "Instructor",
            nextLesson: "Watch Next Lesson",
          }))
        );
      } else {
        // Fallback default enrollment for students
        setEnrolledList([
          {
            id: "1",
            title: "Full Stack Web Development with React & Node",
            progress: 33,
            nextLesson: "2. React Components, Props and State",
            instructor: "Dr. Akash Raj",
          },
        ]);
      }
      setLoading(false);
    }
    loadStudentCourses();
  }, []);

  const firstName = user?.name?.split(" ")[0] || "Learner";

  return (
    <div className="app">
      <Navbar user={user} onLogout={onLogout} />

      <main className="dashboard-page">
        {/* Welcome */}
        <div className="dash-welcome">
          <div>
            <span className="hero-label">STUDENT DASHBOARD</span>
            <h1>
              Welcome back, <span>{firstName}</span>!
            </h1>
            <p>Pick up your video lectures, take quizzes, submit assignments, and ask doubts.</p>
          </div>

          <Link to="/courses" className="primary-btn dash-explore-btn">
            + Explore More Courses
          </Link>
        </div>

        {/* Stats */}
        <div className="dash-stats">
          <div className="dash-stat-card">
            <div className="dash-stat-icon">📚</div>
            <div>
              <strong>{enrolledList.length}</strong>
              <span>Enrolled Courses</span>
            </div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-icon">▶</div>
            <div>
              <strong>Instant</strong>
              <span>Video Classes</span>
            </div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-icon">💬</div>
            <div>
              <strong>Active</strong>
              <span>Doubt Support</span>
            </div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-icon">💳</div>
            <div>
              <strong>RuPay</strong>
              <span>Secured Billing</span>
            </div>
          </div>
        </div>

        <div className="dash-content">
          {/* Enrolled courses */}
          <section className="dash-section">
            <h2>My Enrolled Courses</h2>

            {loading ? (
              <p>Loading your courses...</p>
            ) : enrolledList.length === 0 ? (
              <div className="empty-courses">
                <h3>No enrolled courses yet.</h3>
                <p>Browse our catalog and enroll in a course (with free access or RuPay payment).</p>
                <Link to="/courses" className="primary-btn" style={{ marginTop: "14px", display: "inline-block" }}>
                  Browse Catalog
                </Link>
              </div>
            ) : (
              <div className="dash-courses-list">
                {enrolledList.map((course) => (
                  <div key={course.id} className="dash-course-card">
                    <ProgressRing pct={course.progress} />

                    <div className="dash-course-info">
                      <h3>{course.title}</h3>
                      <span className="dash-instructor">Instructor: {course.instructor}</span>
                      <span className="dash-next-lesson">
                        ▶ {course.nextLesson}
                      </span>

                      <div className="dash-sub-links" style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                        <Link to={`/learn/${course.id}`} className="primary-btn" style={{ padding: "6px 14px", fontSize: "12px" }}>
                          ▶ Watch Classes
                        </Link>
                        <Link to={`/doubts/${course.id}`} className="secondary-btn" style={{ padding: "6px 14px", fontSize: "12px" }}>
                          💬 Ask Doubts
                        </Link>
                        <Link to={`/discuss/${course.id}`} className="secondary-btn" style={{ padding: "6px 14px", fontSize: "12px" }}>
                          👥 Peer Forum
                        </Link>
                      </div>
                    </div>

                    <div className="dash-course-right">
                      <span className="dash-lessons-done">
                        Progress: {course.progress}%
                      </span>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick learning actions */}
          <aside className="dash-aside">
            <h2>Quick Learning Hub</h2>
            <ul className="activity-list">
              <li className="activity-item">
                <div className="activity-dot"></div>
                <div>
                  <span className="activity-action">Video Classroom</span>
                  <span className="activity-detail">Stream high-definition classes at your pace</span>
                  <Link to="/courses" style={{ color: "var(--primary)", fontSize: "12px", fontWeight: 700 }}>
                    Browse all classes →
                  </Link>
                </div>
              </li>
              <li className="activity-item">
                <div className="activity-dot"></div>
                <div>
                  <span className="activity-action">Doubts Resolution</span>
                  <span className="activity-detail">Ask directly to instructor with code context</span>
                </div>
              </li>
              <li className="activity-item">
                <div className="activity-dot"></div>
                <div>
                  <span className="activity-action">Peer Communication</span>
                  <span className="activity-detail">Discuss with classmates across the nation</span>
                </div>
              </li>
              <li className="activity-item">
                <div className="activity-dot"></div>
                <div>
                  <span className="activity-action">RuPay &amp; NPCI</span>
                  <span className="activity-detail">Safe &amp; instant domestic digital transactions</span>
                </div>
              </li>
            </ul>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Dashboard;
