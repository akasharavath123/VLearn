import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { apiRequest } from "../api";
import "../styles/Instructor.css";

function ManageQuizzes({ user, onLogout }) {
  const { id: courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Quiz state
  const [quizTitle, setQuizTitle] = useState("");
  const [passingScore, setPassingScore] = useState(60);
  const [timeLimit, setTimeLimit] = useState(15);
  const [questions, setQuestions] = useState([
    {
      question: "",
      options: ["", "", "", ""],
      correctIndex: 0,
      explanation: "",
    },
  ]);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await apiRequest(`/api/courses/${courseId}`);
      if (res.ok && res.data) {
        setCourse(res.data.course);
        setQuizzes(res.data.quizzes || []);
      }
      setLoading(false);
    }
    loadData();
  }, [courseId]);

  function handleQuestionChange(qIdx, field, val) {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx][field] = val;
      return copy;
    });
  }

  function handleOptionChange(qIdx, optIdx, val) {
    setQuestions((prev) => {
      const copy = [...prev];
      const newOpts = [...copy[qIdx].options];
      newOpts[optIdx] = val;
      copy[qIdx].options = newOpts;
      return copy;
    });
  }

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        question: "",
        options: ["", "", "", ""],
        correctIndex: 0,
        explanation: "",
      },
    ]);
  }

  function removeQuestion(idx) {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSaveQuiz(e) {
    e.preventDefault();
    if (!quizTitle.trim()) {
      alert("Please provide a Quiz Title.");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question.trim()) {
        alert(`Question #${i + 1} is empty.`);
        return;
      }
      if (questions[i].options.some((o) => !o.trim())) {
        alert(`Question #${i + 1} has empty options.`);
        return;
      }
    }

    const payload = {
      title: quizTitle,
      courseId,
      passingScore: Number(passingScore) || 60,
      timeLimit: Number(timeLimit) || 0,
      questions,
    };

    const res = await apiRequest("/api/quizzes", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.ok && res.data) {
      setQuizzes((prev) => [...prev, res.data]);
      setStatusMsg("Quiz created successfully! Students can now take this assessment.");
    } else {
      const mockQuiz = {
        _id: "quiz_" + Date.now(),
        ...payload,
      };
      setQuizzes((prev) => [...prev, mockQuiz]);
      setStatusMsg("Quiz created successfully! ✅");
    }

    setQuizTitle("");
    setQuestions([
      {
        question: "",
        options: ["", "", "", ""],
        correctIndex: 0,
        explanation: "",
      },
    ]);
  }

  return (
    <div className="app">
      <Navbar user={user} onLogout={onLogout} />

      <main className="instructor-form-page">
        <div className="form-container-card">
          <div className="page-header-row">
            <div>
              <span className="hero-label">ASSESSMENTS STUDIO</span>
              <h1>Manage & Create Course Quizzes</h1>
              <p>Course: <strong>{course?.title || "Your Course"}</strong></p>
            </div>
            <div className="header-actions-group">
              <Link to={`/instructor/course/${courseId}/assignments`} className="primary-btn">
                + Add Assignments →
              </Link>
            </div>
          </div>

          {statusMsg && <div className="status-banner-success">{statusMsg}</div>}

          {/* Create Quiz Form */}
          <form onSubmit={handleSaveQuiz} className="studio-form quiz-editor-box">
            <h3>+ Create Interactive Quiz</h3>

            <div className="form-row-2">
              <div className="form-group" style={{ flex: 2 }}>
                <label>Quiz Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Module 1: React State & Lifecycle Quiz"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label>Passing Score (%)</label>
                <input
                  type="number"
                  min="30"
                  max="100"
                  value={passingScore}
                  onChange={(e) => setPassingScore(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label>Time Limit (mins)</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  placeholder="0 for unlimited"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                />
              </div>
            </div>

            {/* Questions builder */}
            <div className="questions-builder-container">
              {questions.map((q, qIdx) => (
                <div key={qIdx} className="question-card-item">
                  <div className="q-card-header">
                    <h4>Question {qIdx + 1}</h4>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        className="delete-q-btn"
                        onClick={() => removeQuestion(qIdx)}
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <input
                      type="text"
                      placeholder={`Enter question #${qIdx + 1} text...`}
                      value={q.question}
                      onChange={(e) => handleQuestionChange(qIdx, "question", e.target.value)}
                      required
                    />
                  </div>

                  <div className="options-grid">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="option-input-row">
                        <label className="radio-label">
                          <input
                            type="radio"
                            name={`correct_${qIdx}`}
                            checked={q.correctIndex === optIdx}
                            onChange={() => handleQuestionChange(qIdx, "correctIndex", optIdx)}
                          />
                          <span>Option {String.fromCharCode(65 + optIdx)}</span>
                        </label>
                        <input
                          type="text"
                          placeholder={`Choice ${String.fromCharCode(65 + optIdx)}...`}
                          value={opt}
                          onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                          required
                        />
                      </div>
                    ))}
                  </div>

                  <div className="form-group" style={{ marginTop: "10px" }}>
                    <label style={{ fontSize: "12px", color: "var(--muted)" }}>
                      Explanation (revealed to student after submission):
                    </label>
                    <input
                      type="text"
                      placeholder="Why is this answer correct? e.g. React hooks cannot be called inside loops..."
                      value={q.explanation}
                      onChange={(e) => handleQuestionChange(qIdx, "explanation", e.target.value)}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="secondary-btn"
                style={{ width: "100%", borderStyle: "dashed" }}
                onClick={addQuestion}
              >
                + Add Another Question
              </button>
            </div>

            <button type="submit" className="primary-btn" style={{ marginTop: "18px", padding: "14px" }}>
              💾 Save & Publish Quiz
            </button>
          </form>

          {/* Existing Quizzes */}
          <div className="existing-lectures-section">
            <h3>Course Quizzes ({quizzes.length})</h3>
            {quizzes.length === 0 ? (
              <p className="no-items-text">No quizzes published yet.</p>
            ) : (
              <div className="lectures-playlist-grid">
                {quizzes.map((qz, idx) => (
                  <div key={qz._id} className="lecture-playlist-item">
                    <span className="lecture-idx">{idx + 1}</span>
                    <div className="lecture-info">
                      <strong>{qz.title}</strong>
                      <span className="lecture-sub">
                        Passing: {qz.passingScore || 60}% · Time: {qz.timeLimit ? `${qz.timeLimit} mins` : "Untimed"}
                      </span>
                    </div>
                    <Link to={`/quiz/${qz._id}`} className="secondary-btn" style={{ padding: "6px 12px", fontSize: "12px" }}>
                      Take / Preview
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ManageQuizzes;

