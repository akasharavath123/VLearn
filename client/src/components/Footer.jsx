import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <Link to="/" className="logo">
        VLearn<span>.</span>
      </Link>

      <p>Learn together. Grow together.</p>

      <p>© {new Date().getFullYear()} VLearn</p>
    </footer>
  );
}

export default Footer;

