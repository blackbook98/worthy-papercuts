import { useEffect, useRef, useState } from "react";
import axios from "../helpers/helper_axios";
import { useNavigate } from "react-router-dom";
import ReviewModal from "./ReviewModal";

const LIST_LABELS = {
  toRead: "To Read",
  currentlyReading: "Reading",
  finished: "Finished",
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
  const [openMenu, setOpenMenu] = useState(null); // { bookId, listName }
  const [reviewTarget, setReviewTarget] = useState(null); // book
  const menuRef = useRef(null);

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
      await axios({
        url: `${process.env.REACT_APP_BE_URL}/saveLists`,
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
        url: `${process.env.REACT_APP_BE_URL}/lists?userId=${localStorage.getItem("userId")}`,
        method: "get",
      });
      // Rearrange the lists according to type: toRead, finished, currentlyReading
      const formatList = (listName) =>
        response.data
          .filter((listInfo) => listInfo.list === listName)
          .map((listInfo) => ({
            id: listInfo.book.book_id,
            volumeInfo: listInfo.book.volume_info,
          }));

      const listsData = {
        toRead: formatList("toRead"),
        finished: formatList("finished"),
        currentlyReading: formatList("currentlyReading"),
      };
      setBookLists(listsData);
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
    <div style={styles.container}>
      <h1 style={styles.title}>My Bookshelf</h1>

      <div style={styles.searchContainer}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search books..."
          style={styles.searchInput}
          onKeyDown={(e) => e.key === "Enter" && fetchBooks()}
        />
        <button onClick={fetchBooks} style={styles.searchButton}>
          Search
        </button>
      </div>

      <section>
        <h2 style={styles.sectionTitle}>Search Results</h2>
        <div style={styles.bookGrid}>
          {books.length === 0 && <p>No books found. Try searching!</p>}
          {books.map((book) => (
            <div key={book.id} style={styles.bookCard}>
              {book.volumeInfo.imageLinks?.thumbnail && (
                <img
                  src={book.volumeInfo.imageLinks.thumbnail}
                  alt={book.volumeInfo.title}
                  style={styles.bookImage}
                />
              )}
              <h3 style={styles.bookTitle}>{book.volumeInfo.title}</h3>
              <p style={styles.authors}>
                {book.volumeInfo.authors?.join(", ") || "Unknown Author"}
              </p>
              <div style={styles.buttonGroup}>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) return;
                    if (value === "remove") removeBookFromLists(book);
                    else addBookToList(book, value);
                    // reset the select back to placeholder
                    e.target.value = "";
                  }}
                  style={{
                    ...styles.listButton,
                    padding: "0.4rem 0.6rem",
                    textAlign: "left",
                    backgroundColor: "#34495e",
                  }}
                >
                  <option value="" disabled>
                    Add to...
                  </option>
                  <option
                    value="toRead"
                    disabled={bookLists.toRead.some((b) => b.id === book.id)}
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
                    disabled={bookLists.finished.some((b) => b.id === book.id)}
                  >
                    Finished
                  </option>
                  {Object.keys(LIST_LABELS).some((l) =>
                    bookLists[l].some((b) => b.id === book.id)
                  ) && <option value="remove">Remove from lists</option>}
                </select>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.listsContainer}>
        {["toRead", "currentlyReading", "finished"].map((list) => (
          <div key={list} style={styles.listSection}>
            <h2>{LIST_LABELS[list].toUpperCase()}</h2>
            {bookLists[list].length === 0 ? (
              <p style={{ fontStyle: "italic" }}>No books in this list</p>
            ) : (
              <ul style={styles.bookList}>
                {bookLists[list].map((book) => {
                  const isOpen =
                    openMenu?.bookId === book.id && openMenu?.listName === list;
                  const otherLists = Object.keys(LIST_LABELS).filter(
                    (l) => l !== list
                  );
                  return (
                    <li key={book.id} style={styles.bookListItem}>
                      <div style={styles.bookListRow}>
                        <div style={styles.bookListText}>
                          {book.volumeInfo.title}
                          <span style={styles.authorsSmall}>
                            {" "}
                            by{" "}
                            {book.volumeInfo.authors?.join(", ") ||
                              "Unknown Author"}
                          </span>
                        </div>
                        <div
                          style={{ position: "relative" }}
                          ref={isOpen ? menuRef : null}
                        >
                          <button
                            style={styles.dotsButton}
                            onClick={() =>
                              setOpenMenu(
                                isOpen
                                  ? null
                                  : { bookId: book.id, listName: list }
                              )
                            }
                          >
                            ⋮
                          </button>
                          {isOpen && (
                            <div style={styles.dropdown}>
                              {otherLists.map((target) => (
                                <div
                                  key={target}
                                  style={styles.dropdownItem}
                                  onClick={() => addBookToList(book, target)}
                                >
                                  {LIST_LABELS[target]}
                                </div>
                              ))}
                              <div
                                style={{
                                  ...styles.dropdownItem,
                                  color: "#e74c3c",
                                }}
                                onClick={() => removeBookFromLists(book)}
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
      </section>

      {reviewTarget && (
        <ReviewModal book={reviewTarget} onClose={closeReview} />
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "90%",
    margin: "1rem auto",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: "#333",
  },
  title: {
    textAlign: "center",
    marginBottom: "1.5rem",
    color: "var(--text)",
  },
  searchContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "2",
    spacing: "1rem",
  },
  searchInput: {
    width: 300,
    padding: "0.5rem 1rem",
    fontSize: "1rem",
    borderRadius: 4,
    border: "1px solid #ccc",
    marginRight: 8,
  },
  searchButton: {
    padding: "0.5rem 1.5rem",
    fontSize: "1rem",
    backgroundColor: "#2980b9",
    border: "none",
    borderRadius: 4,
    color: "white",
    cursor: "pointer",
  },
  sectionTitle: {
    borderBottom: "2px solid #34495e",
    paddingBottom: "0.25rem",
    marginBottom: "1rem",
    color: "var(--text)",
  },
  bookGrid: {
    display: "flex",
    gap: "20px",
    overflowX: "auto",
    paddingBottom: "0.5rem",
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "thin",
    color: "var(--text)",
  },
  bookCard: {
    border: "1px solid #ddd",
    borderRadius: 6,
    padding: "1rem",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    flex: "0 0 180px",
    minWidth: 180,
  },
  bookImage: {
    width: 120,
    height: "auto",
    marginBottom: "0.8rem",
    borderRadius: 4,
  },
  bookTitle: {
    fontSize: "1.1rem",
    marginBottom: "0.4rem",
  },
  authors: {
    fontSize: "0.9rem",
    marginBottom: "0.8rem",
    color: "#555",
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    gap: 8,
  },
  listButton: {
    flexGrow: 1,
    padding: "0.4rem 0",
    border: "none",
    borderRadius: 4,
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },
  listsContainer: {
    marginTop: "3rem",
    display: "flex",
    justifyContent: "space-around",
    gap: "20px",
    flexWrap: "wrap",
  },
  listSection: {
    flexBasis: "30%",
    backgroundColor: "#ecf0f1",
    padding: "1rem",
    borderRadius: 8,
    minWidth: 250,
  },
  bookList: {
    listStyleType: "none",
    paddingLeft: 0,
    maxHeight: "174px",
    overflowY: "auto",
  },
  bookListItem: {
    padding: "0.5rem 0",
    borderBottom: "1px solid #bdc3c7",
    fontWeight: "600",
  },
  bookListRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  bookListText: {
    flex: 1,
    minWidth: 0,
  },
  authorsSmall: {
    fontWeight: "normal",
    fontSize: "0.85rem",
    color: "#7f8c8d",
  },
  dotsButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1.1rem",
    padding: "0 4px",
    color: "#555",
    lineHeight: 1,
    flexShrink: 0,
  },
  dropdown: {
    position: "absolute",
    right: 0,
    top: "100%",
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    borderRadius: 4,
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    zIndex: 100,
    minWidth: 160,
    overflow: "hidden",
  },
  dropdownItem: {
    padding: "0.5rem 0.8rem",
    cursor: "pointer",
    fontSize: "0.9rem",
    whiteSpace: "nowrap",
  },
};

export default Dashboard;
