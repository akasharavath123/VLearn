import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { apiRequest } from "../api";
import "../styles/Auth.css";
import "../styles/Instructor.css";

const CATEGORIES = ["Development", "Design", "Data Science", "Marketing", "Business", "AI & ML"];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];

function CourseEditor({ user, onLogout }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Development",
    level: "Beginner",
    isPaid: true,
    price: 499,
    tags: "react, javascript, web",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title || !form.description) {
      setError("Please provide course title and description.");
      return;
    }

    setLoading(true);
    const tagsArray = form.tags.split(",").map((t) => t.trim()).filter(Boolean);

    const res = await apiRequest("/api/courses", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        price: form.isPaid ? Number(form.price) : 0,
        tags: tagsArray,
      }),
    });

    if (res.ok && res.data?._id) {
      navigate(`/instructor/course/${res.data._id}/upload`);
    } else {
      // Fallback save in localStorage for offline preview
      const localCourses = JSON.parse(localStorage.getItem("vlearn_instructor_courses") || "[]");
      const newCourse = {
        _id: "course_" + Date.now(),
        ...form,
        instructorName: user?.name || "Instructor",
        totalStudents: 0,
      };
      localStorage.setItem("vlearn_instructor_courses", JSON.stringify([...localCourses, newCourse]));
      navigate(`/instructor/course/${newCourse._id}/upload`);
    }

    setLoading(false);
  }

  return (
    <div className="app">
      <Navbar user={user} onLogout={onLogout} />

      <main className="instructor-form-page">
        <div className="form-container-card">
          <div className="page-header-row">
            <div>
              <span className="hero-label">COURSE CREATION</span>
              <h1>Create a New Course</h1>
              <p>Set up the details, select pricing with RuPay payment support, and publish.</p>
            </div>
            <Link to="/instructor" className="secondary-btn">
              ← Back to Studio
            </Link>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="studio-form">
            <div className="form-group">
              <label htmlFor="title">Course Title *</label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="e.g. Master React & Node.js From Scratch"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Course Description *</label>
              <textarea
                id="description"
                name="description"
                rows="4"
                placeholder="What will students learn in this course? Describe the goals, curriculum, and prerequisites."
                value={form.description}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select id="category" name="category" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="level">Skill Level</label>
                <select id="level" name="level" value={form.level} onChange={handleChange}>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pricing Section with RuPay badge */}
            <div className="pricing-box">
              <div className="checkbox-row">
                <input
                  type="checkbox"
                  id="isPaid"
                  name="isPaid"
                  checked={form.isPaid}
                  onChange={handleChange}
                />
                <label htmlFor="isPaid" className="checkbox-label">
                  <strong>Paid Course</strong> (Students purchase using <strong>RuPay / UPI / NetBanking</strong>)
                </label>
              </div>

              {form.isPaid && (
                <div className="form-group" style={{ marginTop: "12px" }}>
                  <label htmlFor="price">Price (in INR ₹)</label>
                  <div className="rupay-input-wrap">
                    <span className="currency-prefix">₹</span>
                    <input
                      id="price"
                      name="price"
                      type="number"
                      min="99"
                      step="50"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="499"
                    />
                    <span className="rupay-badge-inline">💳 RuPay Accepted</span>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags (comma separated)</label>
              <input
                id="tags"
                name="tags"
                type="text"
                placeholder="javascript, react, backend, webdev"
                value={form.tags}
                onChange={handleChange}
              />
            </div>

            <div className="form-actions-row">
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? "Creating Course…" : "Save & Proceed to Upload Classes →"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default CourseEditor;

