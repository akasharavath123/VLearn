import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { apiRequest } from "../api";
import "../styles/Community.css";

function DoubtsPage({ user, onLogout }) {
  const { courseId } = useParams();

  const [course, setCourse] = useState(null);
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState("");
  const [newDetails, setNewDetails] = useState("");
  const [replyInput, setReplyInput] = useState({});
  const [statusMsg, setStatusMsg] = useState("");

  const isInstructor = user?.role === "instructor";

  useEffect(() => {
    async function loadDoubts() {
      setLoading(true);
      const cRes = await apiRequest(`/api/courses/${courseId}`);
      if (cRes.ok && cRes.data?.course) {
        setCourse(cRes.data.course);
      }

      const dRes = await apiRequest(`/api/doubts/course/${courseId}`);
      if (dRes.ok && Array.isArray(dRes.data)) {
        setDoubts(dRes.data);
      } else {
        // Fallback sample
        setDoubts([
          {
            _id: "demo_d1",
            question: "Why should we use useEffect cleanup function with event listeners?",
            details: "If I don't return a cleanup function, does it cause memory leak or duplicate events?",
            studentName: "Aditi Rao",
            isResolved: true,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            replies: [
              {
                authorName: "Dr. Akash Raj",
                authorRole: "instructor",
                text: "Yes! Every time the component re-renders or unmounts, failing to remove the event listener retains references in memory and triggers duplicate handlers.",
                createdAt: new Date().toISOString(),
              },
            ],
          },
        ]);
      }
      setLoading(false);
    }
    loadDoubts();
  }, [courseId]);

  async function handleAskDoubt(e) {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    const payload = {
      courseId,
      question: newQuestion,
      details: newDetails,
    };

    const res = await apiRequest("/api/doubts", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.ok && res.data) {
      setDoubts((prev) => [res.data, ...prev]);
    } else {
      const mockD = {
        _id: "d_" + Date.now(),
        question: newQuestion,
        details: newDetails,
        studentName: user?.name || "Student",
        isResolved: false,
        createdAt: new Date().toISOString(),
        replies: [],
      };
      setDoubts((prev) => [mockD, ...prev]);
    }

    setNewQuestion("");
    setNewDetails("");
    setStatusMsg("Your doubt has been submitted to the instructor! 📩");
    setTimeout(() => setStatusMsg(""), 4000);
  }

  async function handleSendReply(doubtId) {
    const text = replyInput[doubtId];
    if (!text || !text.trim()) return;

    const res = await apiRequest(`/api/doubts/${doubtId}/reply`, {
      method: "POST",
      body: JSON.stringify({ text: text.trim() }),
    });

    const newReply = {
      authorName: user?.name || (isInstructor ? "Instructor" : "Classmate"),
      authorRole: user?.role || "student",
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    setDoubts((prev) =>
      prev.map((d) =>
        d._id === doubtId
          ? { ...d, replies: [...(d.replies || []), newReply] }
          : d
      )
    );

    setReplyInput((prev) => ({ ...prev, [doubtId]: "" }));
  }

  async function handleToggleResolve(doubtId) {
    await apiRequest(`/api/doubts/${doubtId}/resolve`, { method: "PUT" });
    setDoubts((prev) =>
      prev.map((d) =>
        d._id === doubtId ? { ...d, isResolved: !d.isResolved } : d
      )
    );
  }

  return (
    <div className="app">
      <Navbar user={user} onLogout={onLogout} />

      <main className="community-page-container">
        <div className="community-layout-card">
          <div className="community-header">
            <div>
              <span className="hero-label">DOUBTS &amp; Q&amp;A HUB</span>
              <h1>Ask &amp; Resolve Doubts</h1>
              <p>Course: <strong>{course?.title || "Web Development"}</strong></p>
            </div>
            <Link to={`/learn/${courseId}`} className="secondary-btn">
              ▶ Classroom Player
            </Link>
          </div>

          {statusMsg && <div className="status-banner-success">{statusMsg}</div>}

          {/* Ask Doubt Form */}
          <form onSubmit={handleAskDoubt} className="community-create-form">
            <h3>💬 Have a question on this course? Ask the Instructor:</h3>
            <input
              type="text"
              placeholder="State your doubt clearly (e.g. How does async/await error handling work?)"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              required
            />
            <textarea
              rows="3"
              placeholder="Provide background context, code snippet, or lecture timestamp..."
              value={newDetails}
              onChange={(e) => setNewDetails(e.target.value)}
            />
            <button type="submit" className="primary-btn" style={{ alignSelf: "flex-start", padding: "12px 22px" }}>
              Submit Doubt to Instructor
            </button>
          </form>

          {/* Doubts Threads */}
          <div className="threads-container">
            <h3>All Doubts &amp; Discussions ({doubts.length})</h3>

            {loading ? (
              <p>Loading doubts...</p>
            ) : doubts.length === 0 ? (
              <p className="no-items-text">No doubts have been posted yet. Ask your question above!</p>
            ) : (
              doubts.map((d) => (
                <div key={d._id} className="thread-card">
                  <div className="thread-top">
                    <div>
                      <span className={`resolve-status-pill ${d.isResolved ? "resolved" : "open"}`}>
                        {d.isResolved ? "✓ Resolved" : "⏳ Open Doubt"}
                      </span>
                      <h4 className="thread-question">{d.question}</h4>
                      <small className="thread-author">
                        Asked by <strong>{d.studentName || "Student"}</strong> · {new Date(d.createdAt).toLocaleDateString()}
                      </small>
                    </div>

                    {isInstructor && (
                      <button
                        type="button"
                        className="resolve-toggle-btn"
                        onClick={() => handleToggleResolve(d._id)}
                      >
                        {d.isResolved ? "Mark as Open" : "Mark as Resolved ✓"}
                      </button>
                    )}
                  </div>

                  {d.details && <p className="thread-details">{d.details}</p>}

                  {/* Replies Thread */}
                  <div className="thread-replies-list">
                    {d.replies && d.replies.length > 0 ? (
                      d.replies.map((r, ri) => (
                        <div
                          key={ri}
                          className={`reply-bubble ${
                            r.authorRole === "instructor" ? "instructor-reply" : "peer-reply"
                          }`}
                        >
                          <div className="reply-author-line">
                            <strong>
                              {r.authorRole === "instructor" ? "👨‍🏫 Instructor" : "🎓 " + (r.authorName || "Student")}
                            </strong>
                            <small>{new Date(r.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                          </div>
                          <p>{r.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="awaiting-instructor">⏳ Waiting for reply from instructor...</p>
                    )}
                  </div>

                  {/* Reply Input Box */}
                  <div className="reply-input-row">
                    <input
                      type="text"
                      placeholder={isInstructor ? "Reply as Instructor to resolve doubt..." : "Add a reply or tip..."}
                      value={replyInput[d._id] || ""}
                      onChange={(e) =>
                        setReplyInput((prev) => ({ ...prev, [d._id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSendReply(d._id);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="primary-btn reply-btn"
                      onClick={() => handleSendReply(d._id)}
                    >
                      Reply
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default DoubtsPage;

