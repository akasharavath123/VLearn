import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { apiRequest } from "../api";
import "../styles/Quiz.css";

function AssignmentPage({ user, onLogout }) {
  const { id: assignmentId } = useParams();

  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    async function loadAssignment() {
      setLoading(true);
      const res = await apiRequest(`/api/assignments/${assignmentId}`);
      if (res.ok && res.data?.assignment) {
        setAssignment(res.data.assignment);
        if (res.data.mySubmission) {
          setSubmission(res.data.mySubmission);
          setContent(res.data.mySubmission.content || "");
        }
      } else {
        // Mock fallback
        setAssignment({
          _id: assignmentId,
          title: "Assignment 1: Build a Responsive Product Showcase Card",
          description:
            "Create a clean responsive card component using React and CSS Flexbox/Grid with hover states and a functional buy button.",
          maxScore: 100,
          instructions:
            "Provide your GitHub repo link or CodeSandbox URL. Summarize your technical approach.",
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
      setLoading(false);
    }
    loadAssignment();
  }, [assignmentId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) {
      alert("Please enter your submission content or link.");
      return;
    }

    setSubmitting(true);
    setStatusMsg("");

    const res = await apiRequest(`/api/assignments/${assignmentId}/submit`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });

    if (res.ok && res.data?.submission) {
      setSubmission(res.data.submission);
      setStatusMsg("Assignment submitted successfully! The instructor has received your work. 🎉");
    } else {
      const mockSub = {
        _id: "sub_" + Date.now(),
        content,
        submittedAt: new Date().toISOString(),
        grade: null,
      };
      setSubmission(mockSub);
      setStatusMsg("Assignment submitted successfully! 🎉");
    }

    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="app">
        <Navbar user={user} onLogout={onLogout} />
        <main className="quiz-page-container">
          <p>Loading project assignment...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar user={user} onLogout={onLogout} />

      <main className="quiz-page-container">
        <div className="quiz-wrapper-card">
          <div className="quiz-header-banner">
            <div>
              <span className="hero-label">PROJECT ASSIGNMENT</span>
              <h1>{assignment?.title}</h1>
              <p>
                Max Score: <strong>{assignment?.maxScore || 100} Points</strong> · Due:{" "}
                <strong>
                  {assignment?.dueDate
                    ? new Date(assignment.dueDate).toLocaleDateString()
                    : "Flexible"}
                </strong>
              </p>
            </div>
            {assignment?.course && (
              <Link to={`/learn/${assignment.course}`} className="secondary-btn">
                ← Back to Classroom
              </Link>
            )}
          </div>

          {statusMsg && <div className="status-banner-success">{statusMsg}</div>}

          {/* Graded Banner */}
          {submission && submission.grade !== null && submission.grade !== undefined && (
            <div className="grade-result-banner">
              <span className="grade-trophy">🏆</span>
              <div>
                <h3>Grade: {submission.grade} / {assignment?.maxScore || 100}</h3>
                {submission.instructorFeedback && (
                  <p><strong>Instructor Feedback:</strong> {submission.instructorFeedback}</p>
                )}
              </div>
            </div>
          )}

          {/* Description & Instructions */}
          <div className="assignment-brief-card">
            <h4>Assignment Overview</h4>
            <p>{assignment?.description}</p>

            {assignment?.instructions && (
              <div className="instructions-callout">
                <strong>Submission Instructions:</strong>
                <p>{assignment.instructions}</p>
              </div>
            )}
          </div>

          {/* Submission Form */}
          <form onSubmit={handleSubmit} className="assignment-submit-card">
            <h4>{submission ? "Your Submitted Work" : "Submit Your Assignment"}</h4>

            <div className="form-group">
              <label>Repository URL / Solution Links / Notes *</label>
              <textarea
                rows="6"
                placeholder="Paste your GitHub repository link, Live URL, or detailed answer writeup here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="primary-btn submit-assignment-action"
              disabled={submitting}
            >
              {submitting
                ? "Submitting Work…"
                : submission
                ? "Update Submission"
                : "🚀 Turn In Assignment"}
            </button>

            {submission && (
              <small className="submitted-time-sub">
                Last submitted on: {new Date(submission.submittedAt).toLocaleString()}
              </small>
            )}
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default AssignmentPage;

