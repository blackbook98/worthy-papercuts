import { useEffect, useState } from "react";
import axios from "../helpers/helper_axios";
import { useNavigate } from "react-router-dom";
import AgentChat from "./ChatBot";

const LIST_LABELS = {
  toRead: "To Read",
  currentlyReading: "Reading",
  finished: "Finished",
};

function toBookItem(rec) {
  return {
    id: rec.googleBooksId,
    volumeInfo: {
      title: rec.title,
      authors: rec.authors,
      imageLinks: rec.coverImage ? { thumbnail: rec.coverImage } : undefined,
      description: rec.description,
    },
  };
}

function Explore({ addBookToList, bookLists }) {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          navigate("/login");
        }
        const response = await axios({
          url: `${process.env.REACT_APP_BE_URL}/recommender/${userId}`,
          method: "get",
        });
        setBooks(response.data?.books ?? []);
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
    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleExpand = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const currentListOf = (rec) =>
    Object.keys(bookLists).find((l) =>
      bookLists[l].some((b) => b.id === rec.googleBooksId)
    );

  if (loading) {
    return <p style={styles.muted}>Loading recommendations…</p>;
  }

  if (books.length === 0) {
    return (
      <p style={styles.muted}>
        No recommendations yet. Finish some books and we'll suggest what to read
        next.
      </p>
    );
  }

  return (
    <div style={{ position: "relative" }}>
    <div style={styles.grid}>
      {books.map((rec) => {
        const id = rec.googleBooksId;
        const isExpanded = !!expanded[id];
        const inList = currentListOf(rec);
        const bookItem = toBookItem(rec);

        return (
          <div key={id} style={styles.card}>
            <div style={styles.cardTop}>
              {rec.coverImage ? (
                <img
                  src={rec.coverImage}
                  alt={rec.title}
                  style={styles.cover}
                />
              ) : (
                <div style={styles.noCover}>📖</div>
              )}
              <div style={styles.cardMeta}>
                <h3 style={styles.bookTitle}>{rec.title}</h3>
                <p style={styles.authors}>{rec.authors?.join(", ")}</p>
                {rec.averageRating && (
                  <p style={styles.rating}>
                    {"★".repeat(Math.round(rec.averageRating))}
                    {"☆".repeat(5 - Math.round(rec.averageRating))}
                    <span style={styles.ratingNum}> {rec.averageRating}</span>
                  </p>
                )}
                <p style={styles.reason}>{rec.reason}</p>
                <select
                  value={inList ?? ""}
                  onChange={(e) => {
                    if (e.target.value) addBookToList(bookItem, e.target.value);
                  }}
                  style={styles.addSelect}
                >
                  <option value="" disabled={!!inList}>
                    {inList ? `In: ${LIST_LABELS[inList]}` : "+ Add to list"}
                  </option>
                  {Object.entries(LIST_LABELS).map(([key, label]) => (
                    <option key={key} value={key} disabled={inList === key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {rec.description && (
              <div style={styles.descWrap}>
                <p style={styles.desc}>
                  {isExpanded
                    ? rec.description
                    : rec.description.slice(0, 180) +
                      (rec.description.length > 180 ? "…" : "")}
                </p>
                {rec.description.length > 180 && (
                  <button
                    style={styles.readMore}
                    onClick={() => toggleExpand(id)}
                  >
                    {isExpanded ? "Show less" : "Read more"}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>

      {/* Floating chat */}
      {chatOpen && (
        <div style={styles.chatPanel}>
          <div style={styles.chatHeader}>
            <span>Book Assistant</span>
            <button style={styles.chatClose} onClick={() => setChatOpen(false)}>✕</button>
          </div>
          <AgentChat />
        </div>
      )}
      <button style={styles.chatFab} onClick={() => setChatOpen((o) => !o)} title="Chat">
        {chatOpen ? "✕" : "💬"}
      </button>
    </div>
  );
}

const styles = {
  muted: {
    color: "#666",
    fontStyle: "italic",
    marginTop: "2rem",
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  card: {
    backgroundColor: "#111",
    border: "1px solid #222",
    borderRadius: 10,
    padding: "1.2rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.8rem",
  },
  cardTop: {
    display: "flex",
    gap: "1rem",
    alignItems: "flex-start",
  },
  cover: {
    width: 70,
    borderRadius: 5,
    flexShrink: 0,
    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
  },
  noCover: {
    width: 70,
    height: 100,
    backgroundColor: "#1a1a1a",
    borderRadius: 5,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    flexShrink: 0,
  },
  cardMeta: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  bookTitle: {
    margin: 0,
    fontSize: "1rem",
    fontWeight: 700,
    color: "#f5f0e8",
  },
  authors: {
    margin: 0,
    fontSize: "0.85rem",
    color: "#888",
  },
  rating: {
    margin: 0,
    fontSize: "0.85rem",
    color: "#f1c40f",
  },
  ratingNum: {
    color: "#888",
  },
  reason: {
    margin: "0.2rem 0 0.4rem",
    fontSize: "0.82rem",
    color: "#7aabf7",
    fontStyle: "italic",
  },
  addSelect: {
    marginTop: "0.3rem",
    backgroundColor: "#1e1e1e",
    color: "#ccc",
    border: "1px solid #333",
    borderRadius: 5,
    padding: "0.3rem 0.5rem",
    fontSize: "0.82rem",
    cursor: "pointer",
    width: "fit-content",
  },
  descWrap: {
    borderTop: "1px solid #1e1e1e",
    paddingTop: "0.7rem",
  },
  desc: {
    margin: 0,
    fontSize: "0.85rem",
    color: "#a0a0a0",
    lineHeight: 1.6,
  },
  readMore: {
    background: "none",
    border: "none",
    color: "#7aabf7",
    cursor: "pointer",
    fontSize: "0.82rem",
    padding: "0.3rem 0 0",
  },
  chatFab: {
    position: "fixed",
    bottom: "2rem",
    right: "2rem",
    width: 52,
    height: 52,
    borderRadius: "50%",
    backgroundColor: "#a78bfa",
    color: "#fff",
    border: "none",
    fontSize: "1.4rem",
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(167,139,250,0.4)",
    zIndex: 300,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  chatPanel: {
    position: "fixed",
    bottom: "6rem",
    right: "2rem",
    width: 360,
    height: 480,
    backgroundColor: "#111",
    border: "1px solid #2a2a2a",
    borderRadius: 14,
    boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
    zIndex: 300,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  chatHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem 1rem",
    borderBottom: "1px solid #1e1e1e",
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#e5e5e5",
  },
  chatClose: {
    background: "none",
    border: "none",
    color: "#666",
    cursor: "pointer",
    fontSize: "0.9rem",
    padding: 0,
  },
};

export default Explore;
