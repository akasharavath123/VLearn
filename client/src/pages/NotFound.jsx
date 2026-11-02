import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/NotFound.css";

function NotFound({ user, onLogout }) {
  return (
    <div className="app">
      <Navbar user={user} onLogout={onLogout} />

      <main className="nf-page">
        <div className="nf-code">404</div>

        <h1>
          Page <span>not found.</span>
        </h1>

        <p>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="nf-actions">
          <Link to="/" className="primary-btn">
            ← Back to Home
          </Link>
          <Link to="/courses" className="secondary-btn">
            Browse Courses
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default NotFound;

