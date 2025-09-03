import React, { useState, useEffect } from 'react';
import './App.css';
import Details from './details';
import StaffDashboard from './StaffDashboard'; // Add the StaffDashboard component import

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isStaff, setIsStaff] = useState(false); // State to track if the user is a staff
  const [userDetails, setUserDetails] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Test API call to check MySQL connection
    fetch('http://localhost:5000/test')
      .then(res => res.json())
      .then(data => {
        console.log('Test API Response:', data);
      })
      .catch(err => {
        console.error('Test API Error:', err);
      });
  }, []);

  const handleLogin = (event) => {
    event.preventDefault();
    const email = event.target.email.value;
    const password = event.target.password.value;

    fetch(`http://localhost:5000/users?email=${email}&password=${password}`)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          const user = data[0];
          setUserDetails(user);
          setIsLoggedIn(true);
          setIsStaff(user.role === 'staff'); // Check if user is staff
        } else {
          setError('Invalid login credentials');
        }
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setError('Failed to fetch user data');
      });
  };

  const handleLogout = () => {
    setUserDetails(null);
    setIsLoggedIn(false);
    setIsStaff(false); // Reset staff state
  };

  return (
    <div className="app-container">
      {isLoggedIn ? (
        isStaff ? (
          <StaffDashboard staffDetails={userDetails} onLogout={handleLogout} />
        ) : (
          <Details user={userDetails} onLogout={handleLogout} />
        )
      ) : (
        <div className="login-container">
          <h1>GSSSIETW</h1>
          <h2>CSE(AI&ML)</h2>
          <form id="loginForm" onSubmit={handleLogin}>
            <div className="input-group">
              <input type="email" id="email" name="email" placeholder="Email" required />
            </div>
            <div className="input-group">
              <input type="password" id="password" name="password" placeholder="Password" required />
            </div>
            {error && <div className="error">{error}</div>}
            <button type="submit">Login</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default App;
