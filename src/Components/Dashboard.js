import { useEffect, useRef, useState } from "react";
import axios from "../helpers/helper_axios";
import { useNavigate } from "react-router-dom";

import ReviewModal from "./ReviewModal";
import Explore from "./Explore";

const LIST_LABELS = {
  toRead: "To Read",
  currentlyReading: "Reading",
  finished: "Finished",
};

const LIST_ACCENTS = {
  toRead: "#e8a235",
  currentlyReading: "#22d3ee",
  finished: "#4ade80",
};

function Dashboard() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [books, setBooks] = useState([]);
  const [bookLists, setBookLists] = useState({
    toRead: [],
    finished: [],
    currentlyReading: [],
  });
  const [activeTab, setActiveTab] = useState("shelf");
  const [openMenu, setOpenMenu] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [shelfSearch, setShelfSearch] = useState({
    toRead: { open: false, query: "" },
    currentlyReading: { open: false, query: "" },
    finished: { open: false, query: "" },
  });
  const menuRef = useRef(null);

  const toggleShelfSearch = (list) =>
    setShelfSearch((prev) => ({
      ...prev,
      [list]: { open: !prev[list].open, query: "" },
    }));

  const setShelfQuery = (list, value) =>
    setShelfSearch((prev) => ({
      ...prev,
      [list]: { ...prev[list], query: value },
    }));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchBooks = async () => {
    const API_KEY = process.env.REACT_APP_GOOGLE_BOOKS_API_KEY;
    if (!query) return;
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        query
      )}&key=${API_KEY}&maxResults=20&printType=books&orderBy=relevance`
    );
    const data = await response.json();
    const seen = new Set();
    const uniqueBooks = (data?.items || []).filter((book) => {
      const key = book.volumeInfo.title?.toLowerCase().trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const withThumbnail = uniqueBooks.filter(
      (b) => b.volumeInfo.imageLinks?.thumbnail
    );
    const withoutThumbnail = uniqueBooks.filter(
      (b) => !b.volumeInfo.imageLinks?.thumbnail
    );
    setBooks([...withThumbnail, ...withoutThumbnail]);
  };

  const commitBookToList = async (book, listName) => {
    setOpenMenu(null);
    setBookLists((prevLists) => {
      const newLists = { ...prevLists };
      //eslint-disable-next-line array-callback-return
      Object.keys(newLists).map((previousListName) => {
        if (
          previousListName !== listName &&
          bookLists[previousListName].some((b) => b.id === book.id)
        ) {
          newLists[previousListName] = newLists[previousListName].filter(
            (b) => b.id !== book.id
          );
        }
        if (!newLists[listName].some((b) => b.id === book.id)) {
          newLists[listName] = [...newLists[listName], book];
        }
      });
      return newLists;
    });

    try {
      await axios({
        url: `${process.env.REACT_APP_BE_URL}/saveLists`,
        method: "post",
        data: {
          book: book,
          listName: listName,
          user_id: localStorage.getItem("userId"),
        },
      });
    } catch (e) {
      if (e.response?.data?.message?.indexOf("Unauthorized") !== -1) {
        alert("Your login has expired");
        navigate("/login");
      } else {
        console.error(e);
      }
    }
  };

  const addBookToList = async (book, listName) => {
    await commitBookToList(book, listName);
    if (listName === "finished") {
      setReviewTarget(book);
    }
  };

  const closeReview = () => setReviewTarget(null);

  const removeBookFromLists = async (book) => {
    setBookLists((prevLists) => {
      const newLists = { ...prevLists };
      Object.keys(newLists).forEach((list) => {
        newLists[list] = newLists[list].filter((b) => b.id !== book.id);
      });
      return newLists;
    });
    setOpenMenu(null);
    try {
      console.log("Removing book from lists:", book.id);
      console.log("User ID:", localStorage.getItem("userId"));
      await axios({
        url: `${process.env.REACT_APP_BE_URL}/lists`,
        method: "delete",
        data: { book_id: book.id, user_id: localStorage.getItem("userId") },
      });
    } catch (e) {
      if (e.response?.data?.message?.indexOf("Unauthorized") !== -1) {
        alert("Your login has expired");
        navigate("/login");
      } else {
        console.error(e);
      }
    }
  };

  const fetchSavedBookLists = async () => {
    try {
      const response = await axios({
        url: `${
          process.env.REACT_APP_BE_URL
        }/lists?userId=${localStorage.getItem("userId")}`,
        method: "get",
      });
      const formatList = (listName) =>
        response.data
          .filter((listInfo) => listInfo.list === listName)
          .map((listInfo) => ({
            id: listInfo.book.book_id,
            volumeInfo: listInfo.book.volume_info,
          }));

      setBookLists({
        toRead: formatList("toRead"),
        finished: formatList("finished"),
        currentlyReading: formatList("currentlyReading"),
      });
    } catch (e) {
      console.error("Error fetching book lists", e);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("userId")) {
      navigate("/login");
    } else {
      fetchSavedBookLists();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={styles.page}>
      {/* Tabs — global, above everything */}
      <div style={styles.tabBar}>
        {["shelf", "explore"].map((tab) => (
          <button
            key={tab}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "shelf" ? "My Shelf" : "Explore"}
          </button>
        ))}
      </div>

      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerOrn}>✦</div>
          <h1 style={styles.title}>
            {activeTab === "shelf" ? "My Bookshelf" : "Discover Your Next Read"}
          </h1>
          <div style={styles.headerOrn}>✦</div>
        </header>

        {activeTab === "shelf" && (
          <>
            {/* Search */}
            <div style={styles.searchWrapper}>
              <div style={styles.searchBar}>
                <span style={styles.searchIcon}>⌕</span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for a book..."
                  style={styles.searchInput}
                  onKeyDown={(e) => e.key === "Enter" && fetchBooks()}
                />
                <button onClick={fetchBooks} style={styles.searchButton}>
                  Search
                </button>
              </div>
            </div>

            {/* Search Results */}
            <section style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Search Results</h2>
                {books.length > 0 && (
                  <span style={styles.badge}>{books.length}</span>
                )}
              </div>

              {books.length === 0 ? (
                <p style={styles.emptyState}>
                  Search for a book above to discover your next read.
                </p>
              ) : (
                <div style={styles.bookGrid}>
                  {books.map((book) => (
                    <div key={book.id} style={styles.bookCard}>
                      <div style={styles.bookCoverWrap}>
                        {book.volumeInfo.imageLinks?.thumbnail ? (
                          <img
                            src={book.volumeInfo.imageLinks.thumbnail}
                            alt={book.volumeInfo.title}
                            style={styles.bookCover}
                          />
                        ) : (
                          <div style={styles.noCover}>
                            <span style={styles.noCoverIcon}>📖</span>
                          </div>
                        )}
                      </div>
                      <div style={styles.bookInfo}>
                        <h3 style={styles.bookTitle}>
                          {book.volumeInfo.title}
                        </h3>
                        <p style={styles.bookAuthors}>
                          {book.volumeInfo.authors?.join(", ") ||
                            "Unknown Author"}
                        </p>
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            const value = e.target.value;
                            if (!value) return;
                            if (value === "remove") removeBookFromLists(book);
                            else addBookToList(book, value);
                            e.target.value = "";
                          }}
                          style={styles.addSelect}
                        >
                          <option value="" disabled>
                            + Add to list
                          </option>
                          <option
                            value="toRead"
                            disabled={bookLists.toRead.some(
                              (b) => b.id === book.id
                            )}
                          >
                            To Read
                          </option>
                          <option
                            value="currentlyReading"
                            disabled={bookLists.currentlyReading.some(
                              (b) => b.id === book.id
                            )}
                          >
                            Reading
                          </option>
                          <option
                            value="finished"
                            disabled={bookLists.finished.some(
                              (b) => b.id === book.id
                            )}
                          >
                            Finished
                          </option>
                          {Object.keys(LIST_LABELS).some((l) =>
                            bookLists[l].some((b) => b.id === book.id)
                          ) && (
                            <option value="remove">Remove from lists</option>
                          )}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Shelves */}
            <section style={styles.shelvesSection}>
              <h2 style={styles.shelvesSectionTitle}>Your Shelves</h2>
              <div style={styles.shelvesGrid}>
                {["toRead", "currentlyReading", "finished"].map((list) => (
                  <div key={list} style={styles.shelf}>
                    <div
                      style={{
                        ...styles.shelfAccentBar,
                        backgroundColor: LIST_ACCENTS[list],
                      }}
                    />
                    <div style={styles.shelfHeader}>
                      <h3
                        style={{
                          ...styles.shelfTitle,
                          color: LIST_ACCENTS[list],
                        }}
                      >
                        {LIST_LABELS[list].toUpperCase()}
                      </h3>
                      <div style={styles.shelfHeaderRight}>
                        <span
                          style={{
                            ...styles.shelfCount,
                            backgroundColor: LIST_ACCENTS[list] + "22",
                            color: LIST_ACCENTS[list],
                          }}
                        >
                          {bookLists[list].length}
                        </span>
                        {bookLists[list].length > 0 && (
                          <button
                            style={{
                              ...styles.shelfSearchToggle,
                              color: shelfSearch[list].open
                                ? LIST_ACCENTS[list]
                                : "#444",
                            }}
                            onClick={() => toggleShelfSearch(list)}
                            title="Search in list"
                          >
                            🔍
                          </button>
                        )}
                      </div>
                    </div>

                    {shelfSearch[list].open && (
                      <div style={styles.shelfSearchBar}>
                        <input
                          autoFocus
                          type="text"
                          value={shelfSearch[list].query}
                          onChange={(e) => setShelfQuery(list, e.target.value)}
                          placeholder="Filter by title or author..."
                          style={styles.shelfSearchInput}
                        />
                      </div>
                    )}

                    {bookLists[list].length === 0 ? (
                      <p style={styles.shelfEmpty}>Nothing here yet.</p>
                    ) : (
                      <ul style={styles.shelfList}>
                        {bookLists[list]
                          .filter((book) => {
                            const q = shelfSearch[list].query
                              .toLowerCase()
                              .trim();
                            if (!q) return true;
                            return (
                              book.volumeInfo.title
                                ?.toLowerCase()
                                .includes(q) ||
                              book.volumeInfo.authors
                                ?.join(", ")
                                .toLowerCase()
                                .includes(q)
                            );
                          })
                          .map((book) => {
                            const isOpen =
                              openMenu?.bookId === book.id &&
                              openMenu?.listName === list;
                            const otherLists = Object.keys(LIST_LABELS).filter(
                              (l) => l !== list
                            );
                            return (
                              <li key={book.id} style={styles.shelfItem}>
                                <div style={styles.shelfItemRow}>
                                  <div style={styles.shelfItemText}>
                                    <span style={styles.shelfBookTitle}>
                                      {book.volumeInfo.title}
                                    </span>
                                    <span style={styles.shelfBookAuthor}>
                                      {" "}
                                      by{" "}
                                      {book.volumeInfo.authors?.join(", ") ||
                                        "Unknown"}
                                    </span>
                                  </div>
                                  <div
                                    style={{ position: "relative" }}
                                    ref={isOpen ? menuRef : null}
                                  >
                                    <button
                                      style={styles.dotsBtn}
                                      onClick={() =>
                                        setOpenMenu(
                                          isOpen
                                            ? null
                                            : {
                                                bookId: book.id,
                                                listName: list,
                                              }
                                        )
                                      }
                                    >
                                      ⋮
                                    </button>
                                    {isOpen && (
                                      <div style={styles.dropdown}>
                                        <div
                                          style={styles.dropdownItem}
                                          onClick={() =>
                                            navigate(`/about/${book.id}`, {
                                              state: { book },
                                            })
                                          }
                                        >
                                          About
                                        </div>
                                        {otherLists.map((target) => (
                                          <div
                                            key={target}
                                            style={styles.dropdownItem}
                                            onClick={() =>
                                              addBookToList(book, target)
                                            }
                                          >
                                            {LIST_LABELS[target]}
                                          </div>
                                        ))}
                                        <div
                                          style={{
                                            ...styles.dropdownItem,
                                            ...styles.dropdownItemDanger,
                                          }}
                                          onClick={() =>
                                            removeBookFromLists(book)
                                          }
                                        >
                                          Remove from list
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === "explore" && (
          <Explore addBookToList={addBookToList} bookLists={bookLists} />
        )}
      </div>

      {reviewTarget && (
        <ReviewModal book={reviewTarget} onClose={closeReview} />
      )}
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "#0d0d0d",
    backgroundImage:
      "radial-gradient(ellipse at 20% 20%, rgba(79,142,247,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(232,162,53,0.04) 0%, transparent 60%)",
  },
  container: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "2.5rem 2rem 4rem",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: "#e5e5e5",
  },

  // Header
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    marginBottom: "2.5rem",
  },
  title: {
    fontSize: "2.4rem",
    fontWeight: 700,
    letterSpacing: "0.03em",
    color: "#f5f0e8",
    textShadow: "0 0 40px rgba(232,162,53,0.15)",
    margin: 0,
  },
  headerOrn: {
    fontSize: "1rem",
    color: "#f5f0e8",
    opacity: 0.6,
  },

  // Tabs
  tabBar: {
    display: "flex",
    justifyContent: "center",
    gap: 4,
    borderBottom: "1px solid #222",
    backgroundColor: "#0d0d0d",
    position: "sticky",
    top: 0,
    zIndex: 200,
    padding: "0 1rem",
  },
  tab: {
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    color: "#666",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: 600,
    padding: "0.75rem 1.5rem",
    marginBottom: "-1px",
    transition: "color 0.15s",
  },
  tabActive: {
    color: "#a78bfa",
    borderBottomColor: "#a78bfa",
  },

  // Search
  searchWrapper: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "2.5rem",
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#161616",
    border: "1px solid #2e2e2e",
    borderRadius: 50,
    padding: "0.35rem 0.35rem 0.35rem 1.1rem",
    width: "100%",
    maxWidth: 540,
    gap: 8,
    boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
  },
  searchIcon: {
    fontSize: "1.3rem",
    color: "#666",
    userSelect: "none",
    lineHeight: 1,
  },
  searchInput: {
    flex: 1,
    background: "none",
    border: "none",
    outline: "none",
    color: "#e5e5e5",
    fontSize: "1rem",
    padding: "0.3rem 0",
  },
  searchButton: {
    backgroundColor: "#4f8ef7",
    color: "white",
    border: "none",
    borderRadius: 50,
    padding: "0.5rem 1.4rem",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "0.02em",
  },

  // Section
  section: {
    marginBottom: "3rem",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    marginBottom: "1.2rem",
    borderBottom: "1px solid #1f1f1f",
    paddingBottom: "0.6rem",
  },
  sectionTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#888",
    margin: 0,
  },
  badge: {
    backgroundColor: "#1e1e1e",
    color: "#666",
    fontSize: "0.75rem",
    fontWeight: 600,
    padding: "0.15rem 0.5rem",
    borderRadius: 20,
    border: "1px solid #2a2a2a",
  },
  emptyState: {
    color: "#555",
    fontStyle: "italic",
    fontSize: "0.95rem",
    padding: "1rem 0",
  },

  // Book grid
  bookGrid: {
    display: "flex",
    gap: 16,
    overflowX: "auto",
    paddingBottom: "0.75rem",
    scrollbarWidth: "thin",
    scrollbarColor: "#2a2a2a transparent",
  },
  bookCard: {
    flex: "0 0 148px",
    backgroundColor: "#141414",
    border: "1px solid #222",
    borderRadius: 10,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    transition: "transform 0.15s, box-shadow 0.15s",
    cursor: "default",
  },
  bookCoverWrap: {
    width: "100%",
    height: 196,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  bookCover: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  noCover: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1c1c1c",
  },
  noCoverIcon: {
    fontSize: "2.5rem",
    opacity: 0.3,
  },
  bookInfo: {
    padding: "0.7rem 0.7rem 0.6rem",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    flex: 1,
  },
  bookTitle: {
    fontSize: "0.82rem",
    fontWeight: 600,
    color: "#e0e0e0",
    lineHeight: 1.3,
    margin: 0,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  bookAuthors: {
    fontSize: "0.75rem",
    color: "#666",
    margin: 0,
    display: "-webkit-box",
    WebkitLineClamp: 1,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  addSelect: {
    marginTop: "auto",
    width: "100%",
    backgroundColor: "#1e1e1e",
    color: "#aaa",
    border: "1px solid #2e2e2e",
    borderRadius: 6,
    padding: "0.35rem 0.4rem",
    fontSize: "0.75rem",
    cursor: "pointer",
    outline: "none",
  },

  // Shelves
  shelvesSection: {
    marginTop: "1rem",
  },
  shelvesSectionTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#888",
    borderBottom: "1px solid #1f1f1f",
    paddingBottom: "0.6rem",
    marginBottom: "1.2rem",
  },
  shelvesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 20,
  },
  shelf: {
    backgroundColor: "#111",
    border: "1px solid #1e1e1e",
    borderRadius: 12,
    overflow: "hidden",
  },
  shelfAccentBar: {
    height: 3,
    width: "100%",
  },
  shelfHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.9rem 1rem 0.5rem",
  },
  shelfTitle: {
    fontSize: "0.78rem",
    fontWeight: 700,
    letterSpacing: "0.12em",
    margin: 0,
  },
  shelfCount: {
    fontSize: "0.72rem",
    fontWeight: 700,
    padding: "0.15rem 0.55rem",
    borderRadius: 20,
  },
  shelfHeaderRight: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  shelfSearchToggle: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "0.75rem",
    padding: 0,
    lineHeight: 1,
    transition: "color 0.15s",
  },
  shelfSearchBar: {
    padding: "0 0.75rem 0.6rem",
  },
  shelfSearchInput: {
    width: "100%",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 6,
    padding: "0.35rem 0.6rem",
    fontSize: "0.8rem",
    color: "#d5d5d5",
    outline: "none",
    boxSizing: "border-box",
  },
  shelfEmpty: {
    color: "#444",
    fontStyle: "italic",
    fontSize: "0.88rem",
    padding: "0.5rem 1rem 1.2rem",
  },
  shelfList: {
    listStyle: "none",
    padding: "0 0 0.5rem",
    margin: 0,
    minHeight: 220,
    maxHeight: 220,
    overflowY: "auto",
    scrollbarWidth: "thin",
    scrollbarColor: "#2a2a2a transparent",
  },
  shelfItem: {
    borderTop: "1px solid #1a1a1a",
    padding: "0.55rem 1rem",
  },
  shelfItemRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 6,
  },
  shelfItemText: {
    flex: 1,
    minWidth: 0,
    lineHeight: 1.4,
  },
  shelfBookTitle: {
    fontSize: "0.88rem",
    fontWeight: 600,
    color: "#d5d5d5",
  },
  shelfBookAuthor: {
    fontSize: "0.78rem",
    color: "#555",
    fontWeight: 400,
  },
  dotsBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1.1rem",
    color: "#444",
    padding: "0 2px",
    lineHeight: 1,
    flexShrink: 0,
    borderRadius: 4,
  },
  dropdown: {
    position: "absolute",
    right: 0,
    top: "110%",
    backgroundColor: "#1a1a1a",
    border: "1px solid #2e2e2e",
    borderRadius: 8,
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    zIndex: 100,
    minWidth: 170,
    overflow: "hidden",
  },
  dropdownItem: {
    padding: "0.55rem 0.9rem",
    cursor: "pointer",
    fontSize: "0.88rem",
    color: "#ccc",
    whiteSpace: "nowrap",
    transition: "background 0.1s",
  },
  dropdownItemDanger: {
    color: "#e06060",
    borderTop: "1px solid #2a2a2a",
  },
};

export default Dashboard;
