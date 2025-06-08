// import React, { useContext, useState, useEffect } from 'react';
// import { UserContext } from '../App';
// import { useNavigate } from 'react-router-dom';
// import './editProfile.css'

// function EditProfile() {
//   const { userAuth, setUserAuth } = useContext(UserContext);
//   const navigate = useNavigate();

//   const [formData, setFormData] = useState({
//     fullname: '',
//     username: '',
//     bio: ''
//   });

//   const [loading, setLoading] = useState(true); // wait until userAuth is loaded

//   useEffect(() => {
//     // Wait for context to initialize
//     if (userAuth === undefined) return;
// console.log("user----->",userAuth)
//     setFormData({...userAuth});
//     // if (!userAuth || !userAuth.access_token) {
//     //   navigate('/login');
//     // } else {
//     //   setFormData({
//     //     fullname: userAuth.fullname || '',
//     //     username: userAuth.username || '',
//     //     bio: userAuth.bio || ''
//     //   });
//     // }

//     setLoading(false);
//   }, [userAuth, navigate]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     setUserAuth(prev => ({
//       ...prev,
//       fullname: formData.fullname,
//       username: formData.username,
//       bio: formData.bio
//     }));

//     alert('Profile updated successfully!');
//     navigate('/');
//   };

//   if (loading) return <p>Loading...</p>; // avoid rendering form while userAuth is loading

//   return (
//     <div className="edit-profile-container" style={{ maxWidth: '400px', margin: 'auto', padding: '1rem' }}>
//       <h2>Edit Profile</h2>
//       <form onSubmit={handleSubmit}>
//         <label htmlFor="fullname">Full Name</label>
//         <input
//           type="text"
//           id="fullname"
//           name="fullname"
//           value={formData.fullname}
//           onChange={handleChange}
//           required
//           style={{ width: '100%', marginBottom: '1rem' }}
//         />

//         <label htmlFor="username">Username</label>
//         <input
//           type="text"
//           id="username"
//           name="username"
//           value={formData.username}
//           onChange={handleChange}
//           required
//           style={{ width: '100%', marginBottom: '1rem' }}
//         />

//         <label htmlFor="bio">Bio</label>
//         <textarea
//           id="bio"
//           name="bio"
//           value={formData.bio}
//           onChange={handleChange}
//           rows="4"
//           placeholder="Tell us something about you..."
//           style={{ width: '100%', marginBottom: '1rem' }}
//         />

//         <button type="submit" style={{ padding: '0.5rem 1rem' }}>Save Changes</button>
//       </form>
//     </div>
//   );
// }

// export default EditProfile;

import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../App';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './editProfile.css';

function EditProfile() {
  const { userAuth, setUserAuth } = useContext(UserContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullname: '',
    username: '',
    bio: ''
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
   

    setFormData({
      fullname: userAuth.fullname || '',
      username: userAuth.username || '',
      bio: userAuth.bio || ''
    });

    setLoading(false);
  }, [userAuth, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_SOCKET_URL}/api/users/${userAuth.id}`, // <-- adjust your API URL
        {
          fullname: formData.fullname,
          username: formData.username,
          bio: formData.bio
        },
        {
          headers: {
            Authorization: `Bearer ${userAuth.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update context with new values
      setUserAuth(prev => ({
        ...prev,
        fullname: formData.fullname,
        username: formData.username,
        bio: formData.bio
      }));

      alert('Profile updated successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again later.');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="edit-profile-container">
      <h2>Edit Profile</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="fullname">Full Name</label>
        <input
          type="text"
          id="fullname"
          name="fullname"
          value={formData.fullname}
          onChange={handleChange}
          required
        />

        <label htmlFor="username">Username</label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
        />

        <label htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          rows="4"
          placeholder="Tell us something about you..."
        />

        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
}

export default EditProfile;
