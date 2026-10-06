import React, { useState } from "react";
import Navbar from "../assets/components/navbar";
import Footer from "../assets/components/footer";
import "./contact_us.css";

interface ContactUsProps {
  isSignedIn?: boolean;
  onSignOut?: () => void;
}

const ContactUs: React.FC<ContactUsProps> = ({ isSignedIn, onSignOut }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("Order issue");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setName("");
    setEmail("");
    setTopic("Order issue");
    setMessage("");
  };

  return (
    <div className="contact-page">
      <Navbar isSignedIn={isSignedIn} onSignOut={onSignOut} />

      <header className="about-section">
        <div className="about-inner">
          <h1>Contact &amp; Support</h1>
          <p>Tell our support team what you need help with, or use the direct contact details below.</p>
        </div>
      </header>

      <main className="contact-section" id="contact">
        <div className="contact-inner">
          <section className="contact-form">
            <h2>Report an issue</h2>
            <form onSubmit={handleSubmit}>
              <label>
                Name
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setSubmitted(false); }}
                  placeholder="Your name"
                  required
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setSubmitted(false); }}
                  placeholder="you@domain.com"
                  required
                />
              </label>

              <label>
                What can we help with?
                <select value={topic} onChange={(e) => { setTopic(e.target.value); setSubmitted(false); }}>
                  <option>Order issue</option>
                  <option>Product question</option>
                  <option>Delivery or returns</option>
                  <option>Account or payment</option>
                  <option>Other</option>
                </select>
              </label>

              <label>
                Issue details
                <textarea
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); setSubmitted(false); }}
                  placeholder="Describe the issue and include an order number if relevant."
                  rows={6}
                  required
                />
              </label>

              {submitted && <p className="contact-success" role="status">Your report was submitted (demo form). For direct support, contact us using the details alongside this form.</p>}
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Send report
                </button>
              </div>
            </form>
          </section>

          <aside className="contact-details">
            <h3>Get in touch</h3>
            <p>
              For press, partnerships, or general enquiries, reach out via the
              channels below.
            </p>

            <div className="details-list">
              <div className="detail-item">
                <strong>Instagram</strong>
                <span>@a2w_official</span>
              </div>
              <div className="detail-item">
                <strong>Email</strong>
                <a href="mailto:contact@example.com">contact@example.com</a>
              </div>
              <div className="detail-item">
                <strong>Phone</strong>
                <a href="tel:+15551234567">+1 (555) 123-4567</a>
              </div>
              <div className="detail-item">
                <strong>Address</strong>
                <span>123 Studio Lane, Design City</span>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactUs;
