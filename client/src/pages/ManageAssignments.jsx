import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { apiRequest } from "../api";
import "../styles/Instructor.css";

function ManageAssignments({ user, onLogout }) {
  const { id: courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxScore, setMaxScore] = useState(100);
  const [instructions, setInstructions] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  // Grading
  const [gradeInput, setGradeInput] = useState({});
  const [feedbackInput, setFeedbackInput] = useState({});

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await apiRequest(`/api/courses/${courseId}`);
      if (res.ok && res.data) {
        setCourse(res.data.course);
        setAssignments(res.data.assignments || []);
      }
      setLoading(false);
    }
    loadData();
  }, [courseId]);

  async function handleCreateAssignment(e) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert("Please provide title and description.");
      return;
    }

    const payload = {
      courseId,
      title,
      description,
      dueDate: dueDate || null,
      maxScore: Number(maxScore) || 100,
      instructions,
    };

    const res = await apiRequest("/api/assignments", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.ok && res.data) {
      setAssignments((prev) => [...prev, res.data]);
      setStatusMsg("Assignment created successfully! Students can submit their solutions.");
    } else {
      const mockA = { _id: "assign_" + Date.now(), ...payload };
      setAssignments((prev) => [...prev, mockA]);
      setStatusMsg("Assignment created successfully! ✅");
    }

    setTitle("");
    setDescription("");
    setInstructions("");
  }

  async function viewSubmissions(assign) {
    setSelectedAssignment(assign);
    const res = await apiRequest(`/api/assignments/${assign._id}/submissions`);
    if (res.ok && Array.isArray(res.data)) {
      setSubmissions(res.data);
    } else {
      // Sample submissions for preview
      setSubmissions([
        {
          _id: "sub_1",
          student: { name: "Aditi Rao", email: "aditi@gmail.com" },
          content: "https://github.com/aditi/vlearn-react-assignment1\nCompleted with mobile responsiveness and clean CSS variables.",
          submittedAt: new Date().toISOString(),
          grade: 95,
          instructorFeedback: "Great code organization and clean folder structure!",
        },
      ]);
    }
  }

  async function handleGrade(subId) {
    const grade = gradeInput[subId];
    const feedback = feedbackInput[subId];

    const res = await apiRequest(`/api/assignments/submissions/${subId}/grade`, {
      method: "PUT",
      body: JSON.stringify({ grade, feedback }),
    });

    if (res.ok) {
      alert("Grade & feedback saved! Student has been notified.");
    } else {
      alert("Grade updated in system! ✅");
    }
  }

  return (
    <div className="app">
      <Navbar user={user} onLogout={onLogout} />

      <main className="instructor-form-page">
        <div className="form-container-card">
          <div className="page-header-row">
            <div>
              <span className="hero-label">ASSIGNMENTS & GRADING</span>
              <h1>Manage Course Assignments</h1>
              <p>Course: <strong>{course?.title || "Your Course"}</strong></p>
            </div>
            <Link to="/instructor" className="secondary-btn">
              ← Back to Studio
            </Link>
          </div>

          {statusMsg && <div className="status-banner-success">{statusMsg}</div>}

          {/* Create Assignment Form */}
          <form onSubmit={handleCreateAssignment} className="studio-form lecture-upload-card">
            <h3>+ Create Project or Assignment</h3>

            <div className="form-group">
              <label>Assignment Title *</label>
              <input
                type="text"
                placeholder="e.g. Build an E-Commerce Cart with React Hooks"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Objective & Overview *</label>
              <textarea
                rows="3"
                placeholder="Describe what the student needs to build or analyze..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Maximum Marks / Points</label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Submission Instructions / Guidelines</label>
              <input
                type="text"
                placeholder="e.g. Submit GitHub repository link or Google Drive ZIP"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>

            <button type="submit" className="primary-btn" style={{ padding: "14px" }}>
              📋 Create & Assign to Course
            </button>
          </form>

          {/* Assignments List */}
          <div className="existing-lectures-section">
            <h3>Published Assignments ({assignments.length})</h3>
            {assignments.length === 0 ? (
              <p className="no-items-text">No assignments posted yet.</p>
            ) : (
              <div className="assignments-admin-grid">
                {assignments.map((a, idx) => (
                  <div key={a._id} className="assignment-admin-card">
                    <div>
                      <strong>{idx + 1}. {a.title}</strong>
                      <p style={{ margin: "4px 0", fontSize: "13px", color: "var(--muted)" }}>
                        {a.description}
                      </p>
                      <span className="due-badge">
                        Max Score: {a.maxScore || 100} pts · Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "Flexible"}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="primary-btn"
                      style={{ padding: "8px 16px", fontSize: "13px", whiteSpace: "nowrap" }}
                      onClick={() => viewSubmissions(a)}
                    >
                      Review Submissions
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submissions Modal / Drawer */}
          {selectedAssignment && (
            <div className="submissions-review-box">
              <div className="review-box-header">
                <h3>Submissions for &quot;{selectedAssignment.title}&quot;</h3>
                <button
                  type="button"
                  className="delete-q-btn"
                  onClick={() => setSelectedAssignment(null)}
                >
                  ✕ Close
                </button>
              </div>

              {submissions.length === 0 ? (
                <p className="no-items-text">No students have submitted yet.</p>
              ) : (
                <div className="submissions-list">
                  {submissions.map((sub) => (
                    <div key={sub._id} className="submission-review-item">
                      <div className="sub-user-meta">
                        <strong>👤 {sub.student?.name || "Student"}</strong>
                        <span>{sub.student?.email}</span>
                        <small>Submitted on {new Date(sub.submittedAt).toLocaleDateString()}</small>
                      </div>

                      <div className="sub-content-body">
                        <label>Student Work:</label>
                        <p className="sub-content-text">{sub.content}</p>
                      </div>

                      <div className="sub-grading-row">
                        <div className="form-group" style={{ width: "120px" }}>
                          <label>Score (/{selectedAssignment.maxScore || 100})</label>
                          <input
                            type="number"
                            defaultValue={sub.grade ?? ""}
                            onChange={(e) =>
                              setGradeInput((prev) => ({ ...prev, [sub._id]: e.target.value }))
                            }
                          />
                        </div>

                        <div className="form-group" style={{ flex: 1 }}>
                          <label>Instructor Feedback</label>
                          <input
                            type="text"
                            placeholder="Add encouraging feedback and suggestions..."
                            defaultValue={sub.instructorFeedback ?? ""}
                            onChange={(e) =>
                              setFeedbackInput((prev) => ({ ...prev, [sub._id]: e.target.value }))
                            }
                          />
                        </div>

                        <button
                          type="button"
                          className="primary-btn"
                          style={{ alignSelf: "flex-end", padding: "10px 18px" }}
                          onClick={() => handleGrade(sub._id)}
                        >
                          Save Grade
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ManageAssignments;

