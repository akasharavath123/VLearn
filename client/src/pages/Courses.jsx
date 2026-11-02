import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { apiRequest } from "../api";
import "../styles/Courses.css";

const CATEGORIES = ["All", "Development", "Design", "Data Science", "Marketing", "Business", "AI & ML"];
const LEVELS = ["All Levels", "Beginner", "Intermediate", "Advanced"];

function StarRating({ rating }) {
  const r = rating || 4.8;
  return (
    <span className="star-rating">
      {"★".repeat(Math.min(5, Math.round(r)))}
      <em>{r.toFixed(1)}</em>
    </span>
  );
}

function CourseCard({ course }) {
  const isPaid = course.isPaid && (course.price > 0);
  const price = course.price || 499;

  return (
    <Link to={`/courses/${course._id || course.id}`} className="course-card">
      <div className="course-card-thumb">
        <div className="course-thumb-icon">▶</div>
        {isPaid ? (
          <span className="card-rupay-chip">💳 RuPay ₹{price}</span>
        ) : (
          <span className="card-free-chip">🟢 Free</span>
        )}
      </div>

      <div className="course-card-body">
        <div className="course-meta-row">
          <span className="course-category">{course.category || "General"}</span>
          <span className="course-level">
            {course.level || "Beginner"}
          </span>
        </div>

        <h3>{course.title}</h3>
        <p className="course-desc">{course.description}</p>

        <span className="course-instructor">By {course.instructorName || course.instructor?.name || "Dr. Akash Raj"}</span>

        <div className="course-footer">
          <StarRating rating={course.rating} />
          <span className="course-pricing-tag">
            {isPaid ? `₹${price}` : "Free"}
          </span>
        </div>
      </div>
    </Link>
  );
}

function Courses({ user, onLogout }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState("All");
  const [level, setLevel] = useState("All Levels");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      setLoading(true);
      const res = await apiRequest("/api/courses");
      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        setCourses(res.data);
      } else {
        // Fallback initial catalog
        setCourses([
          {
            _id: "1",
            title: "Full Stack Web Development with React & Node",
            instructorName: "Dr. Akash Raj",
            category: "Development",
            level: "Beginner",
            price: 499,
            isPaid: true,
            rating: 4.9,
            description: "Master frontend and backend with modern React, Express, MongoDB, REST APIs, and RuPay checkout.",
          },
          {
            _id: "2",
            title: "UI/UX Design Masterclass & Figma Prototyping",
            instructorName: "Sara Nair",
            category: "Design",
            level: "Intermediate",
            price: 299,
            isPaid: true,
            rating: 4.8,
            description: "Deep-dive into design thinking, wireframing, color psychology, and building interactive prototypes in Figma.",
          },
          {
            _id: "3",
            title: "Python for Beginners & Data Science Basics",
            instructorName: "Rohan Menon",
            category: "Data Science",
            level: "Beginner",
            price: 0,
            isPaid: false,
            rating: 4.7,
            description: "Start programming with Python: variables, loops, data structures, and NumPy/Pandas essentials.",
          },
        ]);
      }
      setLoading(false);
    }
    fetchCourses();
  }, []);

  function handleSearch(e) {
    const val = e.target.value;
    setQuery(val);
    setSearchParams(val ? { q: val } : {});
  }

  const filtered = courses.filter((c) => {
    const ql = query.toLowerCase();
    const matchQuery =
      !query ||
      c.title?.toLowerCase().includes(ql) ||
      c.description?.toLowerCase().includes(ql) ||
      c.instructorName?.toLowerCase().includes(ql);
    const matchCat = category === "All" || c.category === category;
    const matchLevel = level === "All Levels" || c.level === level;
    return matchQuery && matchCat && matchLevel;
  });

  return (
    <div className="app">
      <Navbar user={user} onLogout={onLogout} />

      <main className="courses-page">
        {/* Header */}
        <div className="courses-page-header">
          <span className="hero-label">LEARNING CATALOG</span>
          <h1>
            All <span>Courses</span>
          </h1>
          <p>
            Learn from industry experts with video classes, interactive quizzes, assignments, and secure <strong>RuPay</strong> checkout.
          </p>
        </div>

        {/* Search + filters */}
        <div className="courses-controls">
          <div className="courses-search-wrap">
            <span className="search-icon">⌕</span>
            <input
              className="courses-search"
              type="search"
              placeholder="Search courses, instructors, or topics..."
              value={query}
              onChange={handleSearch}
            />
          </div>

          <div className="courses-filters">
            <div className="filter-group">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Level</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)}>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Bar */}
        <div className="courses-results-bar">
          <span>
            {filtered.length} course{filtered.length !== 1 ? "s" : ""} available · All courses support RuPay payments
          </span>
        </div>

        {loading ? (
          <div className="empty-courses">
            <p>Loading course catalog...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="courses-grid">
            {filtered.map((course) => (
              <CourseCard key={course._id || course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="empty-courses" style={{ marginTop: "20px" }}>
            <h3>No courses match your criteria.</h3>
            <p>Try clearing your search term or selecting another category.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default Courses;
