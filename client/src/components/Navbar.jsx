import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  function handleLogout() {
    if (onLogout) onLogout();
    navigate("/");
  }

  const isInstructor = user?.role === "instructor";

  return (
    <header className="navbar">
      <Link to="/" className="logo">
        VLearn<span>.</span>
      </Link>

      <nav className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/courses">Courses</Link>
        {user && (
          isInstructor ? (
            <Link to="/instructor" className="nav-highlight-link">
              Instructor Studio
            </Link>
          ) : (
            <Link to="/dashboard" className="nav-highlight-link">
              My Learning
            </Link>
          )
        )}
        <a href="/#features">Features</a>
        <a href="/#about">About</a>
      </nav>

      <div className="nav-actions">
        {user ? (
          <div className="nav-user-cluster">
            <span className={`user-role-badge ${isInstructor ? "role-badge-instructor" : "role-badge-student"}`}>
              {isInstructor ? "👨‍🏫 Instructor" : "🎓 Student"}
            </span>

            <Link
              to={isInstructor ? "/instructor" : "/dashboard"}
              className="login-btn nav-dashboard-btn"
            >
              {user.name ? user.name.split(" ")[0] : "Dashboard"}
            </Link>

            <button className="signup-btn nav-logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <>
            <Link to="/login" className="login-btn">
              Login
            </Link>
            <Link to="/signup" className="signup-btn">
              Get Started
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Navbar;
