import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { apiRequest } from "../api";
import "../styles/VideoPlayer.css";

function VideoPlayer({ user, onLogout }) {
  const { courseId } = useParams();

  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [completedVideos, setCompletedVideos] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'doubts' | 'peer' | 'quiz' | 'assignments'

  // Quick Doubt state
  const [doubtQuestion, setDoubtQuestion] = useState("");
  const [doubtDetails, setDoubtDetails] = useState("");
  const [doubtStatus, setDoubtStatus] = useState("");
  const [doubtsList, setDoubtsList] = useState([]);

  // Peer discussion state
  const [peerTopic, setPeerTopic] = useState("");
  const [peerMessage, setPeerMessage] = useState("");
  const [discussionsList, setDiscussionsList] = useState([]);
  const [peerStatus, setPeerStatus] = useState("");

  useEffect(() => {
    async function loadClassroom() {
      setLoading(true);

      const res = await apiRequest(`/api/courses/${courseId}`);
      if (res.ok && res.data) {
        setCourse(res.data.course);
        setVideos(res.data.videos || []);
        setQuizzes(res.data.quizzes || []);
        setAssignments(res.data.assignments || []);
      } else {
        // Fallback demo data
        setCourse({
          _id: courseId,
          title: "Full Stack Web Development with React & Node",
          instructorName: "Dr. Akash Raj",
        });
        setVideos([
          {
            _id: "v1",
            title: "1. Introduction to Web Development Architecture",
            description: "Understanding client-server communication, HTTP protocols, and frontend routing.",
            url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            duration: "14:20",
          },
          {
            _id: "v2",
            title: "2. React Components, Props and State Management",
            description: "Deep dive into component hierarchy, useState hook, and lifting state up.",
            url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            duration: "22:15",
          },
          {
            _id: "v3",
            title: "3. Connecting Express Backend & REST APIs",
            description: "Building Express API routes, connecting to MongoDB, and handling JSON requests.",
            url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            duration: "18:40",
          },
        ]);
        setQuizzes([
          { _id: "q1", title: "React & Web Architecture Fundamentals Quiz", passingScore: 60 },
        ]);
        setAssignments([
          { _id: "a1", title: "Assignment 1: Build a Responsive Showcase Card", maxScore: 100 },
        ]);
      }

      // Load doubts
      const dRes = await apiRequest(`/api/doubts/course/${courseId}`);
      if (dRes.ok && Array.isArray(dRes.data)) {
        setDoubtsList(dRes.data);
      }

      // Load peer discussions
      const discRes = await apiRequest(`/api/discussions/course/${courseId}`);
      if (discRes.ok && Array.isArray(discRes.data)) {
        setDiscussionsList(discRes.data);
      }

      setLoading(false);
    }
    loadClassroom();
  }, [courseId]);

  const currentVideo = videos[currentVideoIndex] || null;

  async function markCompletedAndNext() {
    if (!currentVideo) return;

    if (!completedVideos.includes(currentVideo._id)) {
      const updated = [...completedVideos, currentVideo._id];
      setCompletedVideos(updated);

      // Notify backend of progress
      await apiRequest(`/api/enrollments/${courseId}/progress`, {
        method: "PUT",
        body: JSON.stringify({ videoId: currentVideo._id }),
      });
    }

    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex((prev) => prev + 1);
    }
  }

  async function handleAskDoubt(e) {
    e.preventDefault();
    if (!doubtQuestion.trim()) return;

    const payload = {
      courseId,
      question: doubtQuestion,
      details: doubtDetails,
      videoId: currentVideo?._id,
      videoTitle: currentVideo?.title || "",
    };

    const res = await apiRequest("/api/doubts", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.ok && res.data) {
      setDoubtsList((prev) => [res.data, ...prev]);
    } else {
      const mockDoubt = {
        _id: "d_" + Date.now(),
        question: doubtQuestion,
        details: doubtDetails,
        studentName: user?.name || "You",
        videoTitle: currentVideo?.title,
        replies: [],
        createdAt: new Date(),
      };
      setDoubtsList((prev) => [mockDoubt, ...prev]);
    }

    setDoubtQuestion("");
    setDoubtDetails("");
    setDoubtStatus("Your doubt has been submitted to the instructor! 📩");
    setTimeout(() => setDoubtStatus(""), 4000);
  }

  async function handlePostDiscussion(e) {
    e.preventDefault();
    if (!peerTopic.trim() || !peerMessage.trim()) return;

    const payload = {
      courseId,
      title: peerTopic,
      body: peerMessage,
    };

    const res = await apiRequest("/api/discussions", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.ok && res.data) {
      setDiscussionsList((prev) => [res.data, ...prev]);
    } else {
      const mockDiscussion = {
        _id: "disc_" + Date.now(),
        title: peerTopic,
        body: peerMessage,
        authorName: user?.name || "You",
        authorRole: "student",
        replies: [],
        likes: [],
        createdAt: new Date(),
      };
      setDiscussionsList((prev) => [mockDiscussion, ...prev]);
    }

    setPeerTopic("");
    setPeerMessage("");
    setPeerStatus("Posted to Peer Community! 💬");
    setTimeout(() => setPeerStatus(""), 4000);
  }

  if (loading) {
    return (
      <div className="app">
        <Navbar user={user} onLogout={onLogout} />
        <main className="classroom-loading">
          <p>Loading classroom & lectures...</p>
        </main>
        <Footer />
      </div>
    );
  }

  const progressPercent =
    videos.length > 0 ? Math.round((completedVideos.length / videos.length) * 100) : 0;

  return (
    <div className="app">
      <Navbar user={user} onLogout={onLogout} />

      <main className="classroom-page">
        {/* Course Title Banner */}
        <div className="classroom-top-bar">
          <div>
            <div className="breadcrumb-line">
              <Link to="/courses">Courses</Link> / <span>Classroom</span>
            </div>
            <h2>{course?.title}</h2>
            <span className="inst-sub">Instructor: {course?.instructorName || "Instructor"}</span>
          </div>

          <div className="course-progress-pill">
            <span>Course Progress: {progressPercent}%</span>
            <div className="mini-progress-track">
              <div className="mini-progress-fill" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </div>

        {/* Video Stage & Playlist Layout */}
        <div className="classroom-stage-layout">
          {/* Main Video Viewport */}
          <div className="video-player-container">
            {currentVideo ? (
              <div className="video-viewport">
                <video
                  key={currentVideo.url}
                  controls
                  autoPlay
                  className="native-video-el"
                  poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1000&auto=format&fit=crop&q=80"
                >
                  <source src={currentVideo.url} type="video/mp4" />
                  Your browser does not support HTML5 video streaming.
                </video>
              </div>
            ) : (
              <div className="video-placeholder-empty">
                <h3>No video lectures uploaded yet.</h3>
                <p>The instructor has not uploaded video files for this course.</p>
              </div>
            )}

            {/* Video Controls & Next Button */}
            {currentVideo && (
              <div className="video-bottom-action-bar">
                <div>
                  <h3 className="current-lecture-heading">{currentVideo.title}</h3>
                  <span className="duration-tag">⏱ {currentVideo.duration || "15:00"}</span>
                </div>

                <button
                  type="button"
                  className="primary-btn mark-complete-btn"
                  onClick={markCompletedAndNext}
                >
                  {completedVideos.includes(currentVideo._id)
                    ? "✓ Completed — Next Lesson →"
                    : "Mark as Watched & Next →"}
                </button>
              </div>
            )}

            {/* Classroom Tabbed Sections (Overview, Doubts, Peer Discussion, Quizzes, Assignments) */}
            <div className="classroom-tabs-nav">
              <button
                type="button"
                className={`cr-tab ${activeTab === "overview" ? "active" : ""}`}
                onClick={() => setActiveTab("overview")}
              >
                📖 Lesson Notes
              </button>
              <button
                type="button"
                className={`cr-tab ${activeTab === "doubts" ? "active" : ""}`}
                onClick={() => setActiveTab("doubts")}
              >
                💬 Ask Instructor Doubts ({doubtsList.length})
              </button>
              <button
                type="button"
                className={`cr-tab ${activeTab === "peer" ? "active" : ""}`}
                onClick={() => setActiveTab("peer")}
              >
                👥 Peer-to-Peer Community ({discussionsList.length})
              </button>
              <button
                type="button"
                className={`cr-tab ${activeTab === "quiz" ? "active" : ""}`}
                onClick={() => setActiveTab("quiz")}
              >
                📝 Quizzes ({quizzes.length})
              </button>
              <button
                type="button"
                className={`cr-tab ${activeTab === "assignments" ? "active" : ""}`}
                onClick={() => setActiveTab("assignments")}
              >
                📋 Assignments ({assignments.length})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="classroom-tab-content">
              {/* Tab: Overview */}
              {activeTab === "overview" && (
                <div className="tab-pane">
                  <h4>About this Lecture</h4>
                  <p className="tab-desc-text">
                    {currentVideo?.description ||
                      "In this class, we explore the core principles and architecture. Review the code samples and follow along in your local development environment."}
                  </p>
                  <div className="notes-box">
                    <strong>💡 Learning Tip:</strong> Complete the associated module quiz
                    and assignment to reinforce what you learned in this lecture!
                  </div>
                </div>
              )}

              {/* Tab: Ask Doubts */}
              {activeTab === "doubts" && (
                <div className="tab-pane">
                  <div className="doubt-banner-header">
                    <h4>Direct Doubt Resolution with Instructor</h4>
                    <p>Post a question about this lecture. The instructor will review and post an answer.</p>
                  </div>

                  {doubtStatus && <div className="status-banner-success">{doubtStatus}</div>}

                  <form onSubmit={handleAskDoubt} className="ask-doubt-form">
                    <input
                      type="text"
                      placeholder="What is your doubt or question?"
                      value={doubtQuestion}
                      onChange={(e) => setDoubtQuestion(e.target.value)}
                      required
                    />
                    <textarea
                      rows="2"
                      placeholder="Add more details, error message, or code snippet (optional)..."
                      value={doubtDetails}
                      onChange={(e) => setDoubtDetails(e.target.value)}
                    />
                    <button type="submit" className="primary-btn" style={{ alignSelf: "flex-start", padding: "10px 18px" }}>
                      📩 Submit Doubt to Instructor
                    </button>
                  </form>

                  <div className="doubts-threads-list">
                    <h5>Recent Doubts &amp; Answers</h5>
                    {doubtsList.length === 0 ? (
                      <p className="no-items-text">No doubts posted yet. Be the first to ask!</p>
                    ) : (
                      doubtsList.map((d) => (
                        <div key={d._id} className="doubt-thread-item">
                          <div className="doubt-q-header">
                            <strong>❓ {d.question}</strong>
                            <span className="asker-tag">Asked by {d.studentName || "Student"}</span>
                          </div>
                          {d.details && <p className="doubt-details-text">{d.details}</p>}

                          {/* Replies */}
                          <div className="doubt-replies-tray">
                            {d.replies && d.replies.length > 0 ? (
                              d.replies.map((r, ri) => (
                                <div key={ri} className="doubt-reply-bubble">
                                  <strong>
                                    {r.authorRole === "instructor" ? "👨‍🏫 Instructor Answer:" : `💬 ${r.authorName}:`}
                                  </strong>
                                  <p>{r.text}</p>
                                </div>
                              ))
                            ) : (
                              <span className="awaiting-reply">⏳ Waiting for instructor reply...</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Peer-to-Peer Discussion */}
              {activeTab === "peer" && (
                <div className="tab-pane">
                  <div className="doubt-banner-header">
                    <h4>Peer-to-Peer Discussion Forum</h4>
                    <p>Collaborate, share study notes, and ask fellow students enrolled in this course.</p>
                  </div>

                  {peerStatus && <div className="status-banner-success">{peerStatus}</div>}

                  <form onSubmit={handlePostDiscussion} className="ask-doubt-form">
                    <input
                      type="text"
                      placeholder="Discussion topic title..."
                      value={peerTopic}
                      onChange={(e) => setPeerTopic(e.target.value)}
                      required
                    />
                    <textarea
                      rows="2"
                      placeholder="Share your thoughts, ask classmates for code review, or start a study group..."
                      value={peerMessage}
                      onChange={(e) => setPeerMessage(e.target.value)}
                      required
                    />
                    <button type="submit" className="primary-btn" style={{ alignSelf: "flex-start", padding: "10px 18px" }}>
                      💬 Post to Peer Forum
                    </button>
                  </form>

                  <div className="doubts-threads-list">
                    <h5>Class Discussions ({discussionsList.length})</h5>
                    {discussionsList.length === 0 ? (
                      <p className="no-items-text">No peer discussions yet. Start a topic above!</p>
                    ) : (
                      discussionsList.map((disc) => (
                        <div key={disc._id} className="peer-card-item">
                          <div className="peer-card-top">
                            <strong>🗣️ {disc.title}</strong>
                            <small>By {disc.authorName || "Classmate"}</small>
                          </div>
                          <p className="peer-body-text">{disc.body}</p>
                          <div className="peer-footer-bar">
                            <span>💬 {disc.replies?.length || 0} Replies</span>
                            <Link to={`/discuss/${courseId}`} className="peer-view-thread-btn">
                              Join Discussion Thread →
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Quizzes */}
              {activeTab === "quiz" && (
                <div className="tab-pane">
                  <h4>Interactive Quizzes</h4>
                  <p>Test your comprehension with course assessments.</p>

                  <div className="assessments-card-list">
                    {quizzes.length === 0 ? (
                      <p className="no-items-text">No quizzes published yet for this course.</p>
                    ) : (
                      quizzes.map((qz, idx) => (
                        <div key={qz._id} className="assessment-card-row">
                          <div>
                            <strong>Quiz #{idx + 1}: {qz.title}</strong>
                            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                              Passing mark: {qz.passingScore || 60}% · Instant scoring & explanations
                            </p>
                          </div>
                          <Link to={`/quiz/${qz._id}`} className="primary-btn" style={{ padding: "8px 16px", fontSize: "13px" }}>
                            ✍ Take Quiz
                          </Link>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Assignments */}
              {activeTab === "assignments" && (
                <div className="tab-pane">
                  <h4>Hands-on Assignments</h4>
                  <p>Submit projects and code for instructor evaluation and feedback.</p>

                  <div className="assessments-card-list">
                    {assignments.length === 0 ? (
                      <p className="no-items-text">No assignments posted for this course yet.</p>
                    ) : (
                      assignments.map((a, idx) => (
                        <div key={a._id} className="assessment-card-row">
                          <div>
                            <strong>Project #{idx + 1}: {a.title}</strong>
                            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                              Max Score: {a.maxScore || 100} pts · Submit code repository or writeup
                            </p>
                          </div>
                          <Link to={`/assignment/${a._id}`} className="primary-btn" style={{ padding: "8px 16px", fontSize: "13px" }}>
                            📋 View &amp; Submit
                          </Link>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Lecture Playlist Sidebar */}
          <aside className="classroom-playlist-sidebar">
            <div className="playlist-sidebar-header">
              <h3>Course Lectures</h3>
              <span>{completedVideos.length}/{videos.length} Done</span>
            </div>

            <div className="playlist-scroll-list">
              {videos.map((vid, index) => {
                const isSelected = index === currentVideoIndex;
                const isDone = completedVideos.includes(vid._id);

                return (
                  <button
                    key={vid._id || index}
                    type="button"
                    className={`playlist-lecture-btn ${isSelected ? "selected" : ""} ${isDone ? "done" : ""}`}
                    onClick={() => setCurrentVideoIndex(index)}
                  >
                    <span className="playlist-check-indicator">
                      {isDone ? "✓" : index + 1}
                    </span>
                    <div className="playlist-lecture-meta">
                      <strong>{vid.title}</strong>
                      <span className="playlist-time">⏱ {vid.duration || "10:00"}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="sidebar-quick-links">
              <Link to={`/doubts/${courseId}`} className="sidebar-shortcut-link">
                💬 View All Course Doubts
              </Link>
              <Link to={`/discuss/${courseId}`} className="sidebar-shortcut-link">
                👥 Open Peer Community
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default VideoPlayer;

