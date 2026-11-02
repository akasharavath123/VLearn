import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Home({ user, onLogout }) {
  return (
    <div className="app">
      <Navbar user={user} onLogout={onLogout} />

      <main>
        {/* ── Hero ── */}
        <section className="hero">
          <div className="hero-content">
            <span className="hero-label">YOUR LEARNING JOURNEY STARTS HERE</span>

            <h1>
              Learn New Skills.
              <br />
              <span>Build Your Future.</span>
            </h1>

            <p>
              Learn from expert instructors, explore video courses, solve
              quizzes, and connect with fellow learners. Everything you need to
              grow is in one place.
            </p>

            <div className="hero-actions">
              <Link to="/courses" className="primary-btn">
                Explore Courses →
              </Link>
              <Link to="/signup" className="secondary-btn">
                Become an Instructor
              </Link>
            </div>

            <div className="hero-stats">
              <div>
                <strong>Learn</strong>
                <span>At your own pace</span>
              </div>
              <div>
                <strong>Connect</strong>
                <span>With other learners</span>
              </div>
              <div>
                <strong>Achieve</strong>
                <span>Real learning goals</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="learning-card">
              <div className="learning-icon">▶</div>
              <span className="card-label">YOUR NEXT CHAPTER</span>
              <h2>Knowledge opens doors.</h2>
              <p>Learn something new today.</p>

              <div className="progress-track">
                <div className="progress-fill"></div>
              </div>

              <span className="progress-label">Every lesson moves you forward.</span>
            </div>

            <div className="floating-card">✨ Learn. Practice. Grow.</div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="features" id="features">
          <div className="section-heading">
            <span>WHY VLEARN?</span>
            <h2>More than just video classes</h2>
            <p>Everything you need to learn, practice, and grow together.</p>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <div className="feature-icon">▶</div>
              <h3>Video Learning</h3>
              <p>
                Learn through structured video lessons and downloadable study
                materials.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">✎</div>
              <h3>Interactive Quizzes</h3>
              <p>
                Test your knowledge with quizzes and track your learning
                progress.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">↗</div>
              <h3>Learn Together</h3>
              <p>
                Ask instructors questions and discuss topics with fellow
                students.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">★</div>
              <h3>Earn Certificates</h3>
              <p>
                Complete your courses and earn certificates that recognize your
                achievement.
              </p>
            </article>
          </div>
        </section>

        {/* ── Courses Preview ── */}
        <section className="courses-section" id="courses">
          <div className="section-heading">
            <span>START LEARNING</span>
            <h2>Discover your next course</h2>
            <p>Explore new subjects and build valuable skills.</p>
          </div>

          <div className="empty-courses">
            <h3>Your next learning adventure awaits.</h3>
            <p>Courses will appear here when instructors publish them.</p>
            <Link to="/courses" className="primary-btn" style={{ marginTop: "18px", display: "inline-block" }}>
              Browse All Courses
            </Link>
          </div>
        </section>

        {/* ── About ── */}
        <section className="about-section" id="about">
          <h2>Learning is better together.</h2>
          <p>
            VLearn connects students and instructors through courses,
            discussions, and collaborative learning.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Home;

