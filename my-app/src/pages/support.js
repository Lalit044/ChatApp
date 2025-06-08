import React, { useState } from 'react';
import './Support.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Support = () => {
    const navigate = useNavigate(); 
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await axios.post(`${process.env.REACT_APP_SOCKET_URL}/api/support`, formData);
    console.log('Server Response:', response.data);

    setSubmitted(true);
    setFormData({ name: '', email: '', message: '' });

    setTimeout(() => setSubmitted(false), 3000);
    navigate('/');
  } catch (error) {
    console.error('Error submitting query:', error);
    alert('There was an error submitting your query. Please try again later.');
  }
};

  return (
    <div className="support-container">
      <h2>Contact Support</h2>
      {submitted && <p className="success-message">Query submitted successfully!</p>}
      <form onSubmit={handleSubmit} className="support-form">
        <input
          type="text"
          name="name"
          placeholder="Your Name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Your Email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <textarea
          name="message"
          placeholder="Your Message"
          value={formData.message}
          onChange={handleChange}
          rows={5}
          required
        ></textarea>

        <button type="submit">Submit Query</button>
      </form>
    </div>
  );
};

export default Support;
