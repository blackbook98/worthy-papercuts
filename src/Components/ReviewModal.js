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
        <h2 style={styles.title}>How was it?</h2>
        <p style={styles.bookInfo}>
          <strong>{book.volumeInfo.title}</strong>
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
                color: star <= (hover || rating) ? "#f1c40f" : "#ccc",
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
          <button
            style={styles.submitButton}
            onClick={handleSubmit}
            disabled={rating === 0}
          >
            Submit Review
          </button>
          <button style={styles.skipButton} onClick={onClose}>
            Skip
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
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 500,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: "2rem",
    width: 380,
    maxWidth: "90vw",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
  },
  title: {
    margin: 0,
    fontSize: "1.3rem",
    color: "#2c3e50",
  },
  bookInfo: {
    margin: 0,
    fontSize: "0.95rem",
    color: "#34495e",
  },
  authors: {
    fontWeight: "normal",
    fontSize: "0.85rem",
    color: "#7f8c8d",
  },
  stars: {
    display: "flex",
    gap: 4,
  },
  star: {
    fontSize: "2rem",
    cursor: "pointer",
    transition: "color 0.1s",
    userSelect: "none",
  },
  textarea: {
    width: "100%",
    padding: "0.6rem",
    fontSize: "0.9rem",
    borderRadius: 4,
    border: "1px solid #ccc",
    resize: "vertical",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  actions: {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
  },
  submitButton: {
    padding: "0.5rem 1.2rem",
    backgroundColor: "#2980b9",
    color: "white",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontWeight: "bold",
  },
  skipButton: {
    padding: "0.5rem 1.2rem",
    backgroundColor: "#95a5a6",
    color: "white",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  },
};

export default ReviewModal;
