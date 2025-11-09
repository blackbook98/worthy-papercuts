import { useState } from "react";

function Dashboard() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState([]);

  const fetchBooks = async () => {
    const API_KEY = process.env.REACT_APP_GOOGLE_BOOKS_API_KEY;
    if (!query) return;
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        query
      )}&key=${API_KEY}`
    );
    const data = await response.json();
    setBooks(data.items || []);
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter Book Name"
      />
      <button onClick={fetchBooks}>Search</button>
      <ul>
        {books.map((book) => (
          <li key={book.id}>
            <h3>{book.volumeInfo.title}</h3>
            <p>{book.volumeInfo.authors?.join(", ")}</p>
            {book.volumeInfo.imageLinks?.thumbnail && (
              <img
                src={book.volumeInfo.imageLinks.thumbnail}
                alt={book.volumeInfo.title}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;
