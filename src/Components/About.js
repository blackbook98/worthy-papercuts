import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "../helpers/helper_axios";

function StarDisplay({ rating }) {
  return (
    <span style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ color: s <= rating ? "#f1c40f" : "#444" }}>
          ★
        </span>
      ))}
    </span>
  );
}

function About() {
  const { book_id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const book = state?.book;
  const currentUserId = localStorage.getItem("userId");

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios({
          url: `${process.env.REACT_APP_BE_URL}/reviews/${book_id}`,
          method: "get",
        });
        setReviews(response.data);
      } catch (e) {
        if (e.response?.data?.message?.indexOf("Unauthorized") !== -1) {
          alert("Your login has expired");
          navigate("/login");
        } else {
          console.error(e);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book_id]);

  const myReview = reviews.find((r) => r.userId === currentUserId);
  const otherReviews = reviews.filter((r) => r.userId !== currentUserId);
  const info = book?.volumeInfo;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div style={styles.bookHeader}>
          {info?.imageLinks?.thumbnail ? (
            <img
              src={info.imageLinks.thumbnail}
              alt={info.title}
              style={styles.cover}
            />
          ) : (
            <div style={styles.noCover}>📖</div>
          )}
          <div style={styles.bookMeta}>
            <h1 style={styles.bookTitle}>{info?.title ?? "Unknown Title"}</h1>
            <p style={styles.bookAuthors}>
              {info?.authors?.join(", ") ?? "Unknown Author"}
            </p>
            {info?.publishedDate && (
              <p style={styles.bookYear}>{info.publishedDate.slice(0, 4)}</p>
            )}
          </div>
        </div>

        <h2 style={styles.sectionTitle}>Reviews</h2>

        {loading ? (
          <p style={styles.muted}>Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p style={styles.muted}>No reviews yet.</p>
        ) : (
          <div style={styles.reviewList}>
            {myReview && (
              <div style={{ ...styles.reviewCard, ...styles.myReviewCard }}>
                <div style={styles.reviewHeader}>
                  <span style={styles.youBadge}>You</span>
                  <StarDisplay rating={myReview.rating} />
                </div>
                {myReview.content && (
                  <p style={styles.reviewContent}>{myReview.content}</p>
                )}
              </div>
            )}
            {otherReviews.map((review) => (
              <div key={review.userId} style={styles.reviewCard}>
                <div style={styles.reviewHeader}>
                  <span style={styles.username}>{review.username}</span>
                  <StarDisplay rating={review.rating} />
                </div>
                {review.content && (
                  <p style={styles.reviewContent}>{review.content}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "#0d0d0d",
  },
  container: {
    maxWidth: 700,
    margin: "0 auto",
    padding: "2.5rem 2rem 4rem",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: "#e5e5e5",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#7aabf7",
    cursor: "pointer",
    fontSize: "0.95rem",
    padding: 0,
    marginBottom: "2rem",
  },
  bookHeader: {
    display: "flex",
    gap: "1.5rem",
    alignItems: "flex-start",
    marginBottom: "2.5rem",
  },
  cover: {
    width: 110,
    borderRadius: 6,
    flexShrink: 0,
    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
  },
  noCover: {
    width: 110,
    height: 160,
    backgroundColor: "#1e1e1e",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2rem",
    flexShrink: 0,
  },
  bookMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  bookTitle: {
    margin: 0,
    fontSize: "1.6rem",
    fontWeight: 700,
    color: "#f5f0e8",
  },
  bookAuthors: {
    margin: 0,
    fontSize: "1rem",
    color: "#a0a0a0",
  },
  bookYear: {
    margin: 0,
    fontSize: "0.85rem",
    color: "#666",
  },
  sectionTitle: {
    fontSize: "1.2rem",
    fontWeight: 600,
    color: "#f5f0e8",
    borderBottom: "1px solid #222",
    paddingBottom: "0.5rem",
    marginBottom: "1.2rem",
  },
  muted: {
    color: "#666",
    fontStyle: "italic",
  },
  reviewList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  reviewCard: {
    backgroundColor: "#151515",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    padding: "1rem 1.2rem",
  },
  myReviewCard: {
    borderColor: "#e8a235",
    boxShadow: "0 0 0 1px rgba(232,162,53,0.15)",
  },
  reviewHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "0.5rem",
  },
  youBadge: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#e8a235",
  },
  username: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#a0a0a0",
  },
  starRow: {
    fontSize: "1rem",
    letterSpacing: 2,
  },
  reviewContent: {
    margin: 0,
    fontSize: "0.92rem",
    color: "#c5c5c5",
    lineHeight: 1.6,
  },
};

export default About;
