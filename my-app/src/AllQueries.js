import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AllQueries.css';

const AllQueries = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQueries = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/support');
        setQueries(res.data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch queries:', error);
        setLoading(false);
      }
    };

    fetchQueries();
  }, []);

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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllQueries;
