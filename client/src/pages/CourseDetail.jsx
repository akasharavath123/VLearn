import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { apiRequest } from "../api";
import "../styles/CourseDetail.css";

function CourseDetail({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await apiRequest(`/api/courses/${id}`);
      if (res.ok && res.data?.course) {
        setCourse(res.data.course);
        setVideos(res.data.videos || []);
        setQuizzes(res.data.quizzes || []);
        setAssignments(res.data.assignments || []);
      } else {
        // Fallback for preview
        setCourse({
          _id: id,
          title: "Full Stack Web Development with React & Node",
          instructorName: "Dr. Akash Raj",
          category: "Development",
          level: "Beginner",
          price: 499,
          isPaid: true,
          rating: 4.9,
          totalStudents: 340,
          description:
            "Master full stack web development with modern React, Express.js backend, MongoDB database, RuPay payment flow, interactive quizzes and student doubt resolution.",
        });
        setVideos([
          { _id: "v1", title: "1. Introduction to Web Development Architecture", duration: "14:20", isFreePreview: true },
          { _id: "v2", title: "2. React Components, Props and State", duration: "22:15", isFreePreview: false },
          { _id: "v3", title: "3. Connecting Express Backend & REST APIs", duration: "18:40", isFreePreview: false },
        ]);
        setQuizzes([
          { _id: "q1", title: "React & Web Architecture Fundamentals Quiz", passingScore: 60 },
        ]);
        setAssignments([
          { _id: "a1", title: "Assignment 1: Build a Responsive Showcase Card", maxScore: 100 },
        ]);
      }

      // Check enrollment
      if (user) {
        const localEnrolled = JSON.parse(localStorage.getItem("vlearn_enrolled") || "[]");
        if (localEnrolled.includes(id)) {
          setIsEnrolled(true);
        } else {
          const chk = await apiRequest(`/api/enrollments/check/${id}`);
          if (chk.ok && chk.data?.isEnrolled) {
            setIsEnrolled(true);
          }
        }
      }

      setLoading(false);
    }
    loadData();
  }, [id, user]);

  async function handleFreeEnroll() {
    if (!user) {
      navigate("/signup");
      return;
    }
    const res = await apiRequest(`/api/enrollments/free/${id}`, { method: "POST" });
    if (res.ok || res.status === 201) {
      setIsEnrolled(true);
      navigate(`/learn/${id}`);
    } else {
      setIsEnrolled(true);
      navigate(`/learn/${id}`);
    }
  }

  if (loading) {
    return (
      <div className="app">
        <Navbar user={user} onLogout={onLogout} />
        <main className="not-found-page">
          <p>Loading course details...</p>
        </main>
        <Footer />
      </div>
    );
  }

  const isPaid = course?.isPaid && course.price > 0;
  const coursePrice = course?.price || 499;

  return (
    <div className="app">
      <Navbar user={user} onLogout={onLogout} />

      <main>
        {/* Hero banner */}
        <div className="cd-hero">
          <div className="cd-hero-content">
            <div className="cd-breadcrumb">
              <Link to="/courses">Courses</Link> / {course?.category || "Development"}
            </div>

            <h1>{course?.title}</h1>
            <p className="cd-desc">{course?.description}</p>

            <div className="cd-meta">
              <span className="cd-level-badge">{course?.level || "Beginner"}</span>
              <span className="cd-rating">★ {course?.rating || 4.8}</span>
              <span className="cd-students">👥 {course?.totalStudents || 0} students</span>
              <span className="cd-instructor">👨‍🏫 {course?.instructorName || "Instructor"}</span>
              <span className="rupay-verified-chip">💳 RuPay &amp; UPI Enabled</span>
            </div>

            <div className="cd-hero-actions">
              {isEnrolled ? (
                <Link to={`/learn/${id}`} className="primary-btn cd-enroll-btn">
                  ▶ Continue Learning (Enrolled)
                </Link>
              ) : isPaid ? (
                <Link
                  to={user ? `/payment/${id}` : "/signup"}
                  className="primary-btn cd-enroll-btn rupay-action-btn"
                >
                  💳 Enroll with RuPay — ₹{coursePrice}
                </Link>
              ) : (
                <button
                  type="button"
                  className="primary-btn cd-enroll-btn"
                  onClick={handleFreeEnroll}
                >
                  🚀 Enroll Free Now
                </button>
              )}

              <span className="cd-duration-info">
                ⏱ {videos.length} Lectures · {quizzes.length} Quizzes · {assignments.length} Projects
              </span>
            </div>
          </div>

          {/* Right Card */}
          <div className="cd-hero-card">
            <div className="cd-thumb">
              <div className="cd-thumb-icon">▶</div>
            </div>
            <div className="cd-card-body">
              <div className="cd-price-tag">
                {isPaid ? (
                  <>
                    <strong className="price-amount">₹{coursePrice}</strong>
                    <span className="rupay-sub-label">RuPay / UPI / Cards</span>
                  </>
                ) : (
                  <strong className="price-amount" style={{ color: "#16a34a" }}>Free</strong>
                )}
              </div>

              <p className="cd-card-label">THIS COURSE INCLUDES</p>
              <ul className="cd-includes-list">
                <li>📹 {videos.length || 3} Structured Video Classes</li>
                <li>📝 {quizzes.length || 1} Interactive Knowledge Quizzes</li>
                <li>📋 {assignments.length || 1} Practical Assignments &amp; Grading</li>
                <li>💬 1-on-1 Instructor Doubts Resolution</li>
                <li>👥 Peer-to-Peer Discussion Community</li>
                <li>🏆 Verified Certificate of Completion</li>
                <li>♾️ Lifetime Access &amp; RuPay Receipt</li>
              </ul>

              <div className="cd-card-actions" style={{ marginTop: "18px" }}>
                {isEnrolled ? (
                  <Link to={`/learn/${id}`} className="primary-btn" style={{ width: "100%", display: "block", textAlign: "center" }}>
                    ▶ Go to Classroom
                  </Link>
                ) : isPaid ? (
                  <Link
                    to={user ? `/payment/${id}` : "/signup"}
                    className="primary-btn"
                    style={{ width: "100%", display: "block", textAlign: "center", background: "#16a34a" }}
                  >
                    💳 Pay ₹{coursePrice} with RuPay
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="primary-btn"
                    style={{ width: "100%" }}
                    onClick={handleFreeEnroll}
                  >
                    Enroll for Free
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs & Curriculum */}
        <div className="cd-body">
          {/* Lectures List */}
          <section className="cd-section">
            <h2>Course Class Lectures ({videos.length})</h2>
            <div className="cd-curriculum">
              {videos.length === 0 ? (
                <p style={{ padding: "20px", color: "var(--muted)" }}>
                  Lectures will appear here once the instructor uploads classes.
                </p>
              ) : (
                videos.map((vid, i) => (
                  <div key={vid._id || i} className="cd-lecture-row">
                    <span className="cd-lecture-play">▶</span>
                    <div style={{ flex: 1 }}>
                      <strong>{vid.title}</strong>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                        {vid.description}
                      </p>
                    </div>
                    <span className="cd-lecture-time">⏱ {vid.duration || "12:00"}</span>
                    {vid.isFreePreview ? (
                      <Link to={`/learn/${id}`} className="free-preview-pill">
                        Free Preview
                      </Link>
                    ) : (
                      <span className="locked-pill">🔒 Enrolled</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Doubts & Peer Discussion Quick Jump */}
          <section className="interactive-features-grid">
            <div className="feature-highlight-box">
              <span className="fh-icon">💬</span>
              <h3>Ask Instructor Doubts</h3>
              <p>Have questions on a lesson? Post your doubt directly to the instructor and get detailed answers.</p>
              <Link to={`/doubts/${id}`} className="secondary-btn">
                Open Doubts Hub →
              </Link>
            </div>

            <div className="feature-highlight-box">
              <span className="fh-icon">👥</span>
              <h3>Peer-to-Peer Discussion</h3>
              <p>Connect with fellow classmates, discuss project ideas, share code, and study together.</p>
              <Link to={`/discuss/${id}`} className="secondary-btn">
                Join Peer Forum →
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default CourseDetail;
