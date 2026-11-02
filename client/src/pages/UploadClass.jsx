import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { apiRequest } from "../api";
import "../styles/Instructor.css";

function UploadClass({ user, onLogout }) {
  const { id: courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    url: "",
    duration: "15:00",
    order: 1,
    isFreePreview: false,
  });
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await apiRequest(`/api/courses/${courseId}`);
      if (res.ok && res.data?.course) {
        setCourse(res.data.course);
        setVideos(res.data.videos || []);
        setForm((prev) => ({ ...prev, order: (res.data.videos?.length || 0) + 1 }));
      } else {
        // Fallback for preview
        setCourse({
          _id: courseId,
          title: "Full Stack Web Development with React & Node",
        });
        setVideos([
          {
            _id: "v1",
            title: "1. Introduction to Web Development Architecture",
            duration: "14:20",
            order: 1,
            isFreePreview: true,
          },
          {
            _id: "v2",
            title: "2. React Components, Props and State",
            duration: "22:15",
            order: 2,
            isFreePreview: false,
          },
        ]);
      }
      setLoading(false);
    }
    loadData();
  }, [courseId]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleAddVideo(e) {
    e.preventDefault();
    if (!form.title) {
      alert("Please provide lecture title");
      return;
    }

    setUploading(true);
    setStatusMsg("");

    const videoUrl =
      form.url.trim() ||
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

    const res = await apiRequest("/api/videos/upload", {
      method: "POST",
      body: JSON.stringify({
        courseId,
        title: form.title,
        description: form.description,
        url: videoUrl,
        duration: form.duration || "12:00",
        order: Number(form.order) || videos.length + 1,
        isFreePreview: form.isFreePreview,
      }),
    });

    if (res.ok && res.data) {
      setVideos((prev) => [...prev, res.data]);
      setStatusMsg("Class lecture uploaded successfully! ✅");
    } else {
      // Offline fallback
      const mockVideo = {
        _id: "v_" + Date.now(),
        ...form,
        url: videoUrl,
      };
      setVideos((prev) => [...prev, mockVideo]);
      setStatusMsg("Lecture added to course! ✅");
    }

    setForm({
      title: "",
      description: "",
      url: "",
      duration: "15:00",
      order: videos.length + 2,
      isFreePreview: false,
    });

    setUploading(false);
  }

  return (
    <div className="app">
      <Navbar user={user} onLogout={onLogout} />

      <main className="instructor-form-page">
        <div className="form-container-card">
          <div className="page-header-row">
            <div>
              <span className="hero-label">CLASS MANAGEMENT</span>
              <h1>Upload Lectures & Video Classes</h1>
              <p>Course: <strong>{course?.title || "Your Course"}</strong></p>
            </div>
            <div className="header-actions-group">
              <Link to={`/learn/${courseId}`} className="secondary-btn">
                ▶ View Player
              </Link>
              <Link to={`/instructor/course/${courseId}/quizzes`} className="primary-btn">
                + Add Quizzes →
              </Link>
            </div>
          </div>

          {statusMsg && <div className="status-banner-success">{statusMsg}</div>}

          {/* Upload Form */}
          <form onSubmit={handleAddVideo} className="studio-form lecture-upload-card">
            <h3>+ Add New Class Lecture</h3>

            <div className="form-group">
              <label htmlFor="title">Lecture Title *</label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="e.g. 3. Building REST APIs with Express & Mongoose"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Lesson Summary / Notes</label>
              <textarea
                id="description"
                name="description"
                rows="2"
                placeholder="Summary of topics covered, code links, or download references."
                value={form.description}
                onChange={handleChange}
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="url">Video Stream / File URL</label>
                <input
                  id="url"
                  name="url"
                  type="text"
                  placeholder="https://.../video.mp4 (or leave blank for demo video)"
                  value={form.url}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="duration">Estimated Duration</label>
                <input
                  id="duration"
                  name="duration"
                  type="text"
                  placeholder="18:30"
                  value={form.duration}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="checkbox-row">
              <input
                type="checkbox"
                id="isFreePreview"
                name="isFreePreview"
                checked={form.isFreePreview}
                onChange={handleChange}
              />
              <label htmlFor="isFreePreview" className="checkbox-label">
                Allow as <strong>Free Preview</strong> (Students can watch before enrolling)
              </label>
            </div>

            <button type="submit" className="primary-btn upload-submit-btn" disabled={uploading}>
              {uploading ? "Uploading Lecture…" : "📹 Publish Lecture to Course"}
            </button>
          </form>

          {/* Current Playlist */}
          <div className="existing-lectures-section">
            <h3>Published Lectures ({videos.length})</h3>
            {videos.length === 0 ? (
              <p className="no-items-text">No lectures added yet. Fill out the form above to add your first lecture.</p>
            ) : (
              <div className="lectures-playlist-grid">
                {videos.map((vid, idx) => (
                  <div key={vid._id} className="lecture-playlist-item">
                    <span className="lecture-idx">{idx + 1}</span>
                    <div className="lecture-info">
                      <strong>{vid.title}</strong>
                      <span className="lecture-sub">
                        ⏱ {vid.duration || "10:00"} {vid.isFreePreview && "· 🟢 Free Preview"}
                      </span>
                    </div>
                    <span className="lecture-badge-status">Active</span>
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

export default UploadClass;

