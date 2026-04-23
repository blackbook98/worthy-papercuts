import { useState } from "react";
import axios from "../helpers/helper_axios";
import { useNavigate } from "react-router-dom";

function ReviewModal({ book, onClose }) {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [content, setContent] = useState("");

  const handleSubmit = async () => {
    try {
      await axios({
        url: `${process.env.REACT_APP_BE_URL}/reviews`,
        method: "post",
        data: {
          userId: localStorage.getItem("userId"),
          bookId: book.id,
          rating,
          content: content || undefined,
        },
      });
    } catch (e) {
      if (e.response?.data?.message?.indexOf("Unauthorized") !== -1) {
        alert("Your login has expired");
        navigate("/login");
        return;
      }
      console.error(e);
    }
    onClose();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.topAccent} />
        <h2 style={styles.title}>How was it?</h2>
        <p style={styles.bookInfo}>
          <strong style={styles.bookName}>{book.volumeInfo.title}</strong>
          {book.volumeInfo.authors?.length > 0 && (
            <span style={styles.authors}>
              {" "}by {book.volumeInfo.authors.join(", ")}
            </span>
          )}
        </p>
        <div style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              style={{
                ...styles.star,
                color: star <= (hover || rating) ? "#e8a235" : "#2e2e2e",
                textShadow:
                  star <= (hover || rating)
                    ? "0 0 12px rgba(232,162,53,0.5)"
                    : "none",
              }}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
            >
              ★
            </span>
          ))}
        </div>
        <textarea
          style={styles.textarea}
          placeholder="Write a review... (optional)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
        />
        <div style={styles.actions}>
          <button style={styles.skipButton} onClick={onClose}>
            Skip
          </button>
          <button
            style={{
              ...styles.submitButton,
              opacity: rating === 0 ? 0.4 : 1,
              cursor: rating === 0 ? "not-allowed" : "pointer",
            }}
            onClick={handleSubmit}
            disabled={rating === 0}
          >
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.75)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 500,
  },
  card: {
    backgroundColor: "#111",
    border: "1px solid #222",
    borderRadius: 14,
    padding: "1.8rem 2rem 2rem",
    width: 400,
    maxWidth: "92vw",
    display: "flex",
    flexDirection: "column",
    gap: "1.1rem",
    boxShadow: "0 16px 60px rgba(0,0,0,0.6)",
    overflow: "hidden",
    position: "relative",
  },
  topAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    background: "linear-gradient(90deg, #e8a235, #4ade80)",
  },
  title: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#f0f0f0",
    letterSpacing: "0.02em",
  },
  bookInfo: {
    margin: 0,
    fontSize: "0.9rem",
    color: "#888",
    lineHeight: 1.5,
  },
  bookName: {
    color: "#d5d5d5",
    fontWeight: 600,
  },
  authors: {
    fontWeight: "normal",
    color: "#666",
  },
  stars: {
    display: "flex",
    gap: 6,
  },
  star: {
    fontSize: "2.2rem",
    cursor: "pointer",
    transition: "color 0.1s, text-shadow 0.1s",
    userSelect: "none",
    lineHeight: 1,
  },
  textarea: {
    width: "100%",
    padding: "0.7rem 0.8rem",
    fontSize: "0.9rem",
    borderRadius: 8,
    border: "1px solid #252525",
    backgroundColor: "#161616",
    color: "#d5d5d5",
    resize: "vertical",
    fontFamily: "inherit",
    boxSizing: "border-box",
    outline: "none",
  },
  actions: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
  },
  submitButton: {
    padding: "0.55rem 1.4rem",
    backgroundColor: "#4f8ef7",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: "0.9rem",
    letterSpacing: "0.02em",
  },
  skipButton: {
    padding: "0.55rem 1.1rem",
    backgroundColor: "transparent",
    color: "#666",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: "0.9rem",
  },
};

export default ReviewModal;
