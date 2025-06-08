import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AllQueries.css';

const AllQueries = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_SOCKET_URL}/api/support`);
      setQueries(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch queries:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this query?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`${process.env.REACT_APP_SOCKET_URL}/api/support/${id}`);
      // Remove deleted query from UI
      setQueries(prev => prev.filter(query => query._id !== id));
    } catch (error) {
      console.error('Failed to delete query:', error);
      alert("Error deleting query. Try again.");
    }
  };

  return (
    <div className="queries-container">
      <h2>Support Queries</h2>
      {loading ? (
        <p className="loading">Loading queries...</p>
      ) : queries.length === 0 ? (
        <p className="no-queries">No support queries yet.</p>
      ) : (
        <div className="query-grid">
          {queries.map((query) => (
            <div className="query-card" key={query._id}>
              <h3>{query.name}</h3>
              <p><strong>Email:</strong> {query.email}</p>
              <p><strong>Message:</strong><br />{query.message}</p>
              <p className="date">
                {new Date(query.submittedAt).toLocaleString()}
              </p>
              <button className="delete-btn" onClick={() => handleDelete(query._id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllQueries;
