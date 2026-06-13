import React, { useState } from "react";
import Navbar from "../assets/components/navbar";
import Footer from "../assets/components/footer";
import "./contact_us.css";

const ContactUs: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder submission behavior
    console.log("Contact submission", { name, email, message });
    alert("Thank you — your message has been sent (demo).");
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <div className="contact-page">
      <Navbar />

      <header className="about-section">
        <div className="about-inner">
          <h1>About Us</h1>

          <h2>The Curated Perspective</h2>
          <p>
            We believe that garments are more than just utility; they are a
            medium of personal architecture and identity. Founded as a
            progressive digital sanctuary for independent fashion houses and
            vanguard designers, our marketplace bridges the gap between raw,
            visionary talent and the discerning global collector.
          </p>
          <p>We don't offer mass production. We curate expressions.</p>

          <h2>Architectural Integrity</h2>
          <p>
            Our platform functions as an intentional multi-vendor ecosystem. By
            granting independent designers complete autonomy over their digital
            storefronts, production lines, and seasonal drops, we bypass
            traditional retail bureaucracy. This direct-to-designer pipeline
            ensures that our collectors receive authentic, high-concept pieces
            directly from the hands that drafted them.
          </p>
          <p>
            From concept sketch to final construction, every silhouette hosted
            on our platform is a testament to meticulous material choices and
            technical craftsmanship.
          </p>

          <h2>Our Pillars</h2>
          <ul>
            <li>
              <strong>Vanguard Design:</strong> We intentionally select creators
              who challenge contemporary style norms and focus on premium,
              editorial-grade execution.
            </li>
            <li>
              <strong>Radical Transparency:</strong> By connecting consumers
              directly with independent labels, we elevate the narrative of who
              made your clothes and how they were brought to life.
            </li>
            <li>
              <strong>Quiet Luxury:</strong> Our digital experience reflects our
              design philosophy: desaturated, intentional, and entirely focused
              on the structural detail of the garment itself.
            </li>
          </ul>

          <h2>The Studio</h2>
          <p>
            We are a platform engineered for the next era of fashion houses. By
            merging state-of-the-art digital infrastructure with uncompromised
            aesthetic curation, we give creators the tools to manage their
            identity and collectors the access to invest in rare design.
          </p>
          <p>Welcome to a redefined standard of modern luxury.</p>
        </div>
      </header>

      <main className="contact-section" id="contact">
        <div className="contact-inner">
          <section className="contact-form">
            <h2>Contact Us</h2>
            <form onSubmit={handleSubmit}>
              <label>
                Name
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  required
                />
              </label>

              <label>
                Message
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message..."
                  rows={6}
                  required
                />
              </label>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Send
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
                <span>contact@example.com</span>
              </div>
              <div className="detail-item">
                <strong>Phone</strong>
                <span>+1 (555) 123-4567</span>
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
