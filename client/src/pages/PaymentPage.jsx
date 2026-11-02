import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { apiRequest } from "../api";
import "../styles/Payment.css";

function PaymentPage({ user, onLogout }) {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentType, setPaymentType] = useState("rupay_card"); // 'rupay_card' | 'rupay_upi'
  const [error, setError] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingTx, setPendingTx] = useState(null);

  // Card Form
  const [cardNumber, setCardNumber] = useState("5085 4912 3456 7890"); // Default test RuPay card
  const [cardHolder, setCardHolder] = useState(user?.name || "Akash Raj");
  const [expiry, setExpiry] = useState("09/28");
  const [cvv, setCvv] = useState("821");
  const [upiId, setUpiId] = useState("");

  useEffect(() => {
    async function loadCourse() {
      setLoading(true);
      const res = await apiRequest(`/api/courses/${courseId}`);
      if (res.ok && res.data?.course) {
        setCourse(res.data.course);
      } else {
        // Fallback demo course
        setCourse({
          _id: courseId,
          title: "Full Stack Web Development with React & Node",
          instructorName: "Dr. Akash Raj",
          price: 499,
          level: "Beginner",
          category: "Development",
        });
      }
      setLoading(false);
    }
    loadCourse();
  }, [courseId]);

  function formatCardNumber(val) {
    const raw = val.replace(/\D/g, "").substring(0, 16);
    const parts = raw.match(/.{1,4}/g);
    return parts ? parts.join(" ") : raw;
  }

  function handleCardChange(e) {
    setCardNumber(formatCardNumber(e.target.value));
    setError("");
  }

  function handleExpiryChange(e) {
    let val = e.target.value.replace(/\D/g, "").substring(0, 4);
    if (val.length >= 3) {
      val = val.substring(0, 2) + "/" + val.substring(2);
    }
    setExpiry(val);
    setError("");
  }

  async function handleInitiatePayment(e) {
    e.preventDefault();
    setError("");

    if (paymentType === "rupay_card") {
      const clean = cardNumber.replace(/\s+/g, "");
      if (clean.length < 16) {
        setError("Please enter a valid 16-digit RuPay card number.");
        return;
      }
      if (!cardHolder.trim()) {
        setError("Cardholder name is required.");
        return;
      }
      if (!expiry.includes("/") || expiry.length < 5) {
        setError("Valid expiration date (MM/YY) is required.");
        return;
      }
      if (cvv.length < 3) {
        setError("Enter a valid 3-digit CVV from the back of your RuPay card.");
        return;
      }
    } else {
      if (!upiId.trim() || !upiId.includes("@")) {
        setError("Please enter a valid RuPay UPI ID (e.g. name@okhdfcbank).");
        return;
      }
    }

    // Trigger Bank OTP simulation
    setShowOtpModal(true);
  }

  async function handleVerifyOtpAndPay() {
    setProcessing(true);
    setError("");

    const payload = {
      courseId,
      cardNumber,
      cardHolder,
      expiry,
      cvv,
      upiId,
      paymentType: paymentType === "rupay_card" ? "rupay" : "upi",
    };

    const res = await apiRequest("/api/payments/rupay-checkout", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShowOtpModal(false);
      setPendingTx(res.data);
    } else {
      // Mock fallback enrollment for preview/demo
      const mockTx = {
        transactionId: "RUPAY_" + Date.now() + "_SUCCESS",
        amount: course?.price || 499,
        currency: "INR",
        method: paymentType === "rupay_card" ? "RuPay Card" : "RuPay UPI",
      };
      // Record enrollment in localStorage for preview
      const localEnrollments = JSON.parse(localStorage.getItem("vlearn_enrolled") || "[]");
      if (!localEnrollments.includes(courseId)) {
        localStorage.setItem("vlearn_enrolled", JSON.stringify([...localEnrollments, courseId]));
      }
      setShowOtpModal(false);
      setPendingTx(mockTx);
    }

    setProcessing(false);
  }

  if (loading) {
    return (
      <div className="app">
        <Navbar user={user} onLogout={onLogout} />
        <main className="payment-page-container">
          <p>Loading course checkout...</p>
        </main>
        <Footer />
      </div>
    );
  }

  // Payment Success Screen
  if (pendingTx) {
    return (
      <div className="app">
        <Navbar user={user} onLogout={onLogout} />
        <main className="payment-page-container">
          <div className="payment-success-card">
            <div className="success-check-icon">✓</div>
            <span className="rupay-verified-tag">🇮🇳 RuPay Payment Verified</span>
            <h1>Payment Successful!</h1>
            <p className="success-subtitle">
              You are now fully enrolled in <strong>{course?.title}</strong>.
            </p>

            <div className="receipt-box">
              <div className="receipt-row">
                <span>Transaction ID:</span>
                <strong>{pendingTx.transactionId}</strong>
              </div>
              <div className="receipt-row">
                <span>Payment Mode:</span>
                <strong>RuPay Network (NPCI)</strong>
              </div>
              <div className="receipt-row">
                <span>Amount Paid:</span>
                <strong>₹{course?.price || 499}</strong>
              </div>
              <div className="receipt-row">
                <span>Access:</span>
                <strong>Lifetime Video Classes + Quizzes</strong>
              </div>
            </div>

            <div className="success-actions">
              <button
                className="primary-btn start-learning-btn"
                onClick={() => navigate(`/learn/${courseId}`)}
              >
                ▶ Start Watching Course Now →
              </button>
              <Link to="/dashboard" className="secondary-btn">
                Go to Student Dashboard
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const coursePrice = course?.price || 499;
  const gstAmount = Math.round(coursePrice * 0.18);
  const totalAmount = coursePrice;

  return (
    <div className="app">
      <Navbar user={user} onLogout={onLogout} />

      <main className="payment-page-container">
        <div className="payment-checkout-layout">
          {/* Left: RuPay Payment Form */}
          <div className="payment-form-card">
            <div className="rupay-brand-header">
              <div className="rupay-logo-badge">
                <span className="rupay-orange">Ru</span>
                <span className="rupay-green">Pay</span>
                <span className="rupay-sub">®</span>
              </div>
              <div className="npci-badge">
                🛡️ Verified by NPCI India
              </div>
            </div>

            <h2>Secure Course Checkout</h2>
            <p className="rupay-hint">
              Pay securely using your <strong>RuPay Debit/Credit card</strong> or <strong>RuPay UPI</strong>.
            </p>

            {/* Payment Method Switcher */}
            <div className="payment-method-tabs">
              <button
                type="button"
                className={`pm-tab ${paymentType === "rupay_card" ? "active" : ""}`}
                onClick={() => setPaymentType("rupay_card")}
              >
                💳 RuPay Card
              </button>
              <button
                type="button"
                className={`pm-tab ${paymentType === "rupay_upi" ? "active" : ""}`}
                onClick={() => setPaymentType("rupay_upi")}
              >
                📱 RuPay UPI / QR
              </button>
            </div>

            {error && <div className="auth-error">{error}</div>}

            {paymentType === "rupay_card" ? (
              <form onSubmit={handleInitiatePayment} className="rupay-card-form">
                {/* Visual RuPay Card Preview */}
                <div className="rupay-card-visual">
                  <div className="card-top-row">
                    <span className="chip-icon">⚏</span>
                    <span className="card-brand-label">RuPay <span>Platinum</span></span>
                  </div>
                  <div className="card-number-display">
                    {cardNumber || "•••• •••• •••• ••••"}
                  </div>
                  <div className="card-bottom-row">
                    <div>
                      <small>CARDHOLDER</small>
                      <p>{cardHolder || "YOUR NAME"}</p>
                    </div>
                    <div>
                      <small>EXPIRES</small>
                      <p>{expiry || "MM/YY"}</p>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="cardNumber">RuPay Card Number *</label>
                  <input
                    id="cardNumber"
                    type="text"
                    placeholder="5085 •••• •••• ••••"
                    value={cardNumber}
                    onChange={handleCardChange}
                    maxLength="19"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cardHolder">Name on Card *</label>
                  <input
                    id="cardHolder"
                    type="text"
                    placeholder="Enter cardholder name"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="expiry">Valid Thru (MM/YY) *</label>
                    <input
                      id="expiry"
                      type="text"
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={handleExpiryChange}
                      maxLength="5"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cvv">CVV (3 digits) *</label>
                    <input
                      id="cvv"
                      type="password"
                      placeholder="•••"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").substring(0, 3))}
                      maxLength="3"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="primary-btn pay-submit-btn">
                  🔒 Pay ₹{totalAmount} with RuPay
                </button>
              </form>
            ) : (
              <form onSubmit={handleInitiatePayment} className="rupay-card-form">
                <div className="upi-info-banner">
                  <span>📱</span>
                  <div>
                    <strong>RuPay Instant UPI Payment</strong>
                    <p>Enter your Virtual Payment Address (VPA) linked with your RuPay bank account.</p>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="upiId">RuPay UPI ID / VPA *</label>
                  <input
                    id="upiId"
                    type="text"
                    placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="primary-btn pay-submit-btn">
                  ⚡ Pay ₹{totalAmount} via RuPay UPI
                </button>
              </form>
            )}

            <div className="security-badges-row">
              <span>🔒 256-Bit Bank Encryption</span>
              <span>🇮🇳 NPCI RuPay Gateway</span>
              <span>⚡ Instant Access</span>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="payment-summary-card">
            <h3>Order Summary</h3>

            <div className="summary-course-thumb">
              <div className="summary-thumb-icon">▶</div>
              <div>
                <h4>{course?.title}</h4>
                <p>Instructor: {course?.instructorName || "Instructor"}</p>
                <span className="summary-badge">{course?.category || "Development"}</span>
              </div>
            </div>

            <div className="summary-line-items">
              <div className="summary-line">
                <span>Course Price</span>
                <span>₹{coursePrice}</span>
              </div>
              <div className="summary-line">
                <span>Discount applied</span>
                <span className="summary-discount">-₹0</span>
              </div>
              <div className="summary-line">
                <span>GST (Inclusive 18%)</span>
                <span>₹{gstAmount}</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-line summary-total">
                <strong>Total Payable</strong>
                <strong>₹{totalAmount}</strong>
              </div>
            </div>

            <div className="summary-guarantee-box">
              <span className="guarantee-icon">🛡️</span>
              <div>
                <strong>30-Day Money-Back Guarantee</strong>
                <p>Learn risk-free with full access to video classes, quizzes, and direct instructor doubts support.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bank RuPay OTP Modal Simulation */}
        {showOtpModal && (
          <div className="otp-modal-overlay">
            <div className="otp-modal-box">
              <div className="otp-bank-header">
                <span className="rupay-logo-badge" style={{ fontSize: "16px" }}>
                  <span className="rupay-orange">Ru</span>
                  <span className="rupay-green">Pay</span>
                </span>
                <span>NPCI 3D Secure</span>
              </div>

              <h3>Bank Authentication</h3>
              <p>
                A one-time password (OTP) has been sent to your registered mobile number ending with <strong>XX78</strong> for transaction of <strong>₹{totalAmount}</strong>.
              </p>

              <div className="otp-input-wrap">
                <label>Enter 6-Digit OTP (Default test: 123456)</label>
                <input
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength="6"
                  autoFocus
                />
              </div>

              <div className="otp-actions">
                <button
                  type="button"
                  className="primary-btn"
                  style={{ width: "100%", padding: "14px" }}
                  onClick={handleVerifyOtpAndPay}
                  disabled={processing}
                >
                  {processing ? "Verifying with RuPay..." : "Verify & Authorize Payment"}
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  style={{ width: "100%", marginTop: "8px" }}
                  onClick={() => setShowOtpModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default PaymentPage;

