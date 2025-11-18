import { useState } from "react";
import axios from "../helpers/helper_axios";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState([]);
  const [bookLists, setBookLists] = useState({
    toRead: [],
    finished: [],
    currentlyReading: [],
  });

  const fetchBooks = async () => {
    const API_KEY = process.env.REACT_APP_GOOGLE_BOOKS_API_KEY;
    if (!query) return;
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        query
      )}&key=${API_KEY}&maxResults=20&printType=books&orderBy=relevance`
    );
    const data = await response.json();
    let books_data_first = [];
    let books_data_second = [];

    //eslint-disable-next-line array-callback-return
    data?.items?.map((book) => {
      if (book.volumeInfo.imageLinks?.thumbnail) {
        books_data_first.push(book);
      } else {
        books_data_second.push(book);
      }
    });
    setBooks([...books_data_first, ...books_data_second] || []);
  };

  const addBookToList = async (book, listName) => {
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

  const removeBookFromLists = (book) => {
    setBookLists((prevLists) => {
      const newLists = { ...prevLists };

      //eslint-disable-next-line array-callback-return
      Object.keys(newLists).map((listName) => {
        if (newLists[listName].some((b) => b.id === book.id)) {
          newLists[listName] = newLists[listName].filter(
            (b) => b.id !== book.id
          );
        }
      });

      return newLists;
    });
  };

  let listName = (book) => {
    let camelMap = {
      toRead: "To Read",
      finished: "Finished",
      currentlyReading: "Currently Reading",
    };

    const listName = Object.keys(bookLists).find((list) =>
      bookLists[list].some((b) => b.id === book.id)
    );
    let current_list =
      listName && camelMap[listName] ? camelMap[listName] : null;
    return current_list;
  };

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
                    Currently Reading
                  </option>
                  <option
                    value="finished"
                    disabled={bookLists.finished.some((b) => b.id === book.id)}
                  >
                    Finished
                  </option>
                  {listName(book) && (
                    <option value="remove">Remove from lists</option>
                  )}
                </select>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.listsContainer}>
        {["toRead", "currentlyReading", "finished"].map((listName) => (
          <div key={listName} style={styles.listSection}>
            <h2 style={styles.sectionTitle}>
              {listName.replace(/([A-Z])/g, " $1").toUpperCase()}
            </h2>
            {bookLists[listName].length === 0 ? (
              <p style={{ fontStyle: "italic" }}>No books in this list</p>
            ) : (
              <ul style={styles.bookList}>
                {bookLists[listName].map((book) => (
                  <li key={book.id} style={styles.bookListItem}>
                    {book.volumeInfo.title}{" "}
                    <span style={styles.authorsSmall}>
                      by{" "}
                      {book.volumeInfo.authors?.join(", ") || "Unknown Author"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </section>
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
    color: "#2c3e50",
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
  },
  bookGrid: {
    display: "flex",
    gap: "20px",
    overflowX: "auto",
    paddingBottom: "0.5rem",
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "thin",
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
  },
  bookListItem: {
    padding: "0.5rem 0",
    borderBottom: "1px solid #bdc3c7",
    fontWeight: "600",
  },
  authorsSmall: {
    fontWeight: "normal",
    fontSize: "0.85rem",
    color: "#7f8c8d",
  },
};

export default Dashboard;
