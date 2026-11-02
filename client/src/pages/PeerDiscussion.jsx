import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { apiRequest } from "../api";
import "../styles/Community.css";

function PeerDiscussion({ user, onLogout }) {
  const { courseId } = useParams();

  const [course, setCourse] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [replyInputs, setReplyInputs] = useState({});
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    async function loadDiscussions() {
      setLoading(true);
      const cRes = await apiRequest(`/api/courses/${courseId}`);
      if (cRes.ok && cRes.data?.course) {
        setCourse(cRes.data.course);
      }

      const dRes = await apiRequest(`/api/discussions/course/${courseId}`);
      if (dRes.ok && Array.isArray(dRes.data)) {
        setDiscussions(dRes.data);
      } else {
        // Fallback sample discussion
        setDiscussions([
          {
            _id: "disc_1",
            title: "Study Group: React Hooks & State Management Best Practices",
            body: "Hey everyone! Anyone interested in reviewing assignment 1 solutions and discussing custom hooks patterns together this weekend?",
            authorName: "Rohan Menon",
            authorRole: "student",
            likes: ["user1", "user2"],
            createdAt: new Date().toISOString(),
            replies: [
              {
                authorName: "Sara Nair",
                authorRole: "student",
                text: "Count me in! I've been experimenting with useReducer vs Context API.",
                createdAt: new Date().toISOString(),
              },
            ],
          },
        ]);
      }
      setLoading(false);
    }
    loadDiscussions();
  }, [courseId]);

  async function handleCreateTopic(e) {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;

    const payload = {
      courseId,
      title: newTitle,
      body: newBody,
    };

    const res = await apiRequest("/api/discussions", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.ok && res.data) {
      setDiscussions((prev) => [res.data, ...prev]);
    } else {
      const mockTopic = {
        _id: "disc_" + Date.now(),
        title: newTitle,
        body: newBody,
        authorName: user?.name || "You",
        authorRole: user?.role || "student",
        likes: [],
        replies: [],
        createdAt: new Date().toISOString(),
      };
      setDiscussions((prev) => [mockTopic, ...prev]);
    }

    setNewTitle("");
    setNewBody("");
    setStatusMsg("Topic shared with your classmates! 💬");
    setTimeout(() => setStatusMsg(""), 4000);
  }

  async function handleReply(discId) {
    const text = replyInputs[discId];
    if (!text || !text.trim()) return;

    await apiRequest(`/api/discussions/${discId}/reply`, {
      method: "POST",
      body: JSON.stringify({ text: text.trim() }),
    });

    const newReply = {
      authorName: user?.name || "You",
      authorRole: user?.role || "student",
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    setDiscussions((prev) =>
      prev.map((d) =>
        d._id === discId
          ? { ...d, replies: [...(d.replies || []), newReply] }
          : d
      )
    );

    setReplyInputs((prev) => ({ ...prev, [discId]: "" }));
  }

  async function handleLike(discId) {
    await apiRequest(`/api/discussions/${discId}/like`, { method: "POST" });
    setDiscussions((prev) =>
      prev.map((d) => {
        if (d._id === discId) {
          const currentCount = Array.isArray(d.likes) ? d.likes.length : Number(d.likes) || 0;
          return { ...d, likes: new Array(currentCount + 1).fill("uid") };
        }
        return d;
      })
    );
  }

  return (
    <div className="app">
      <Navbar user={user} onLogout={onLogout} />

      <main className="community-page-container">
        <div className="community-layout-card">
          <div className="community-header">
            <div>
              <span className="hero-label">PEER COMMUNITY</span>
              <h1>Classmate Peer-to-Peer Forum</h1>
              <p>Course: <strong>{course?.title || "Web Development"}</strong></p>
            </div>
            <Link to={`/learn/${courseId}`} className="secondary-btn">
              ▶ Classroom Player
            </Link>
          </div>

          {statusMsg && <div className="status-banner-success">{statusMsg}</div>}

          {/* Create Topic Form */}
          <form onSubmit={handleCreateTopic} className="community-create-form">
            <h3>👥 Start a Discussion with Classmates:</h3>
            <input
              type="text"
              placeholder="What topic or question would you like to discuss with peers?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
            <textarea
              rows="3"
              placeholder="Share notes, project ideas, study resources, or questions for other students..."
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              required
            />
            <button type="submit" className="primary-btn" style={{ alignSelf: "flex-start", padding: "12px 22px" }}>
              Share with Classmates
            </button>
          </form>

          {/* Discussions List */}
          <div className="threads-container">
            <h3>Peer Threads ({discussions.length})</h3>

            {loading ? (
              <p>Loading discussions...</p>
            ) : discussions.length === 0 ? (
              <p className="no-items-text">No peer discussions yet. Start the conversation above!</p>
            ) : (
              discussions.map((disc) => (
                <div key={disc._id} className="thread-card">
                  <div className="thread-top">
                    <div>
                      <h4 className="thread-question">🗣️ {disc.title}</h4>
                      <small className="thread-author">
                        Posted by <strong>{disc.authorName || "Classmate"}</strong> ({disc.authorRole || "Student"}) · {new Date(disc.createdAt).toLocaleDateString()}
                      </small>
                    </div>

                    <button
                      type="button"
                      className="like-counter-btn"
                      onClick={() => handleLike(disc._id)}
                    >
                      ❤️ {Array.isArray(disc.likes) ? disc.likes.length : 0} Likes
                    </button>
                  </div>

                  <p className="thread-details">{disc.body}</p>

                  {/* Replies */}
                  <div className="thread-replies-list">
                    {disc.replies && disc.replies.length > 0 ? (
                      disc.replies.map((r, ri) => (
                        <div key={ri} className="reply-bubble peer-reply">
                          <div className="reply-author-line">
                            <strong>💬 {r.authorName || "Peer"}</strong>
                            <small>{new Date(r.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                          </div>
                          <p>{r.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="awaiting-instructor">No replies yet. Be the first classmate to respond!</p>
                    )}
                  </div>

                  {/* Reply Input */}
                  <div className="reply-input-row">
                    <input
                      type="text"
                      placeholder="Write a constructive reply to this classmate..."
                      value={replyInputs[disc._id] || ""}
                      onChange={(e) =>
                        setReplyInputs((prev) => ({ ...prev, [disc._id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleReply(disc._id);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="primary-btn reply-btn"
                      onClick={() => handleReply(disc._id)}
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

export default PeerDiscussion;

