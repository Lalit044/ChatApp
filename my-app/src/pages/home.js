import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate hook
import "./home.css";
import { UserContext } from "../App";

const HomePage = () => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate(); // Initialize navigation hook
  const {
    userAuth: { role },
  } = useContext(UserContext);
  useEffect(() => {
    // Fetch users from your API
    fetch(`${process.env.REACT_APP_SOCKET_URL}/api/users`)
      .then((response) => response.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error("Error fetching users:", err));
  }, []);

  // Handle navigation when a chat card is clicked
  const handleChatClick = (userId) => {
    navigate(`/users/chat/${userId}`); // Redirect to the chat route
  };
  const handleDashboardClick = () => {
    navigate("/admin"); // Navigate to the admin dashboard
  };
  const handleQueryClick = () => {
    navigate("/admin/query");
  };
  return (
    <div className="home-page">
      <h1>Chats</h1>
      {role === "admin" && (
        <div>
          <button
            className="go-to-dashboard-btn"
            onClick={handleDashboardClick}
            style={{ marginRight: "10px" }} 
          >
            Go to Dashboard
          </button>

          <button className="go-to-dashboard-btn" onClick={handleQueryClick}>
            All Query
          </button>
        </div>
      )}
      <div className="chat-list">
        {users.map((user) => (
          <div
            key={user._id}
            className="chat-card"
            onClick={() => handleChatClick(user._id)} 
          >
            <div className="chat-header">
              <img
                src={user.personal_info.profile_img}
                alt={user.personal_info.fullname}
                className="profile-image"
              />
              <div className="chat-header-details">
                <h2>{user.personal_info.fullname}</h2>
                <p>{user.personal_info.bio}</p>
              </div>
            </div>
            <div className="social-links">
              {user.social_links.instagram && (
                <a
                  href={user.social_links.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram
                </a>
              )}
              {user.social_links.github && (
                <a
                  href={user.social_links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
