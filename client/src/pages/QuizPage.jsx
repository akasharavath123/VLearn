import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { apiRequest } from "../api";
import "../styles/Quiz.css";

function QuizPage({ user, onLogout }) {
  const { id: quizId } = useParams();

  const [quiz, setQuiz] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function loadQuiz() {
      setLoading(true);
      const res = await apiRequest(`/api/quizzes/${quizId}`);
      if (res.ok && res.data?.quiz) {
        setQuiz(res.data.quiz);
        if (res.data.priorSubmission) {
          setResult({
            score: res.data.priorSubmission.score,
            passed: res.data.priorSubmission.score >= (res.data.quiz.passingScore || 60),
            submission: res.data.priorSubmission,
          });
        }
      } else {
        // Sample quiz for preview
        setQuiz({
          _id: quizId,
          title: "React & Web Architecture Fundamentals Quiz",
          passingScore: 60,
          questions: [
            {
              _id: "q1",
              question: "What is the Virtual DOM in React?",
              options: [
                "A direct copy of the HTML DOM in the browser",
                "A lightweight in-memory representation of the real DOM",
                "A database engine for React state",
                "A server-side cache for HTTP requests",
              ],
            },
            {
              _id: "q2",
              question: "Which HTTP method is idempotent and primarily used to update an entire resource?",
              options: ["POST", "GET", "PUT", "DELETE"],
            },
            {
              _id: "q3",
              question: "Which React hook is used to run side-effects like data fetching or DOM subscriptions?",
              options: ["useState", "useContext", "useEffect", "useReducer"],
            },
          ],
        });
      }
      setLoading(false);
    }
    loadQuiz();
  }, [quizId]);

  function handleSelectOption(qIdx, optIdx) {
    if (result) return; // already submitted
    setSelectedAnswers((prev) => ({
      ...prev,
      [qIdx]: optIdx,
    }));
  }

  async function handleSubmitQuiz(e) {
    e.preventDefault();
    if (!quiz) return;

    const answersArray = quiz.questions.map((_, i) =>
      selectedAnswers[i] !== undefined ? selectedAnswers[i] : -1
    );

    if (answersArray.includes(-1)) {
      if (!window.confirm("You have unanswered questions. Are you sure you want to submit?")) {
        return;
      }
    }

    setSubmitting(true);

    const res = await apiRequest(`/api/quizzes/${quizId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers: answersArray }),
    });

    if (res.ok && res.data) {
      setResult(res.data);
    } else {
      // Mock grading for preview
      let correct = 0;
      const review = quiz.questions.map((q, i) => {
        const isCor = selectedAnswers[i] === (i === 0 ? 1 : i === 1 ? 2 : 2);
        if (isCor) correct++;
        return {
          question: q.question,
          options: q.options,
          selected: selectedAnswers[i],
          correctIndex: i === 0 ? 1 : i === 1 ? 2 : 2,
          isCorrect: isCor,
          explanation: "Standard React and HTTP specification behavior.",
        };
      });

      const score = Math.round((correct / quiz.questions.length) * 100);
      setResult({
        score,
        correctCount: correct,
        totalQuestions: quiz.questions.length,
        passed: score >= (quiz.passingScore || 60),
        review,
      });
    }

    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="app">
        <Navbar user={user} onLogout={onLogout} />
        <main className="quiz-page-container">
          <p>Loading assessment...</p>
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
          {/* Header */}
          <div className="quiz-header-banner">
            <div>
              <span className="hero-label">ASSESSMENT</span>
              <h1>{quiz?.title}</h1>
              <p>Passing Score: <strong>{quiz?.passingScore || 60}%</strong> · Select one choice per question.</p>
            </div>
            {quiz?.course && (
              <Link to={`/learn/${quiz.course}`} className="secondary-btn">
                ← Back to Classroom
              </Link>
            )}
          </div>

          {/* Results Display */}
          {result && (
            <div className={`quiz-score-banner ${result.passed ? "passed" : "failed"}`}>
              <div className="score-icon">{result.passed ? "🏆" : "⚠️"}</div>
              <div>
                <h2>{result.passed ? "Congratulations! You Passed!" : "Needs Improvement"}</h2>
                <p>
                  You scored <strong>{result.score}%</strong>
                  {result.correctCount !== undefined && ` (${result.correctCount} of ${result.totalQuestions} correct)`}.
                  Passing requirement was {quiz?.passingScore || 60}%.
                </p>
              </div>
            </div>
          )}

          {/* Questions */}
          <form onSubmit={handleSubmitQuiz} className="quiz-questions-list">
            {quiz?.questions.map((q, qIdx) => {
              const reviewItem = result?.review ? result.review[qIdx] : null;

              return (
                <div
                  key={q._id || qIdx}
                  className={`quiz-question-box ${
                    reviewItem ? (reviewItem.isCorrect ? "q-correct" : "q-incorrect") : ""
                  }`}
                >
                  <div className="q-number-title">
                    <span className="q-badge">Q{qIdx + 1}</span>
                    <h3>{q.question}</h3>
                  </div>

                  <div className="quiz-options-group">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedAnswers[qIdx] === optIdx;
                      let extraClass = "";

                      if (reviewItem) {
                        if (optIdx === reviewItem.correctIndex) extraClass = "opt-correct-target";
                        else if (isSelected && !reviewItem.isCorrect) extraClass = "opt-wrong-target";
                      } else if (isSelected) {
                        extraClass = "opt-selected";
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`quiz-choice-item ${extraClass}`}
                          onClick={() => handleSelectOption(qIdx, optIdx)}
                        >
                          <span className="choice-letter">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="choice-text">{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Review Explanation */}
                  {reviewItem && reviewItem.explanation && (
                    <div className="q-explanation-box">
                      <strong>💡 Explanation:</strong> {reviewItem.explanation}
                    </div>
                  )}
                </div>
              );
            })}

            {!result && (
              <button
                type="submit"
                className="primary-btn submit-quiz-btn"
                disabled={submitting}
              >
                {submitting ? "Scoring Assessment…" : "✓ Submit Assessment Answers"}
              </button>
            )}
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default QuizPage;

