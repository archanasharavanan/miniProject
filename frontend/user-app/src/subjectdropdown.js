import React, { useState, useEffect } from 'react';

const SubjectDropdown = ({ user_id, value, onChange }) => {
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);  // To handle loading state
    const [error, setError] = useState(null);  // To handle errors

    // Dynamic URL setup
    const BACKEND_URL = process.env.NODE_ENV === 'production' 
        ? 'https://your-backend-url.com' // Replace with your actual backend URL for production
        : 'http://localhost:5000'; // Use localhost during development

    useEffect(() => {
        if (user_id) {
            setIsLoading(true);  // Set loading state to true before fetching
            fetch(`${BACKEND_URL}/subjects?user_id=${user_id}`)
                .then((res) => {
                    if (!res.ok) {
                        throw new Error('Failed to fetch subjects');
                    }
                    return res.json();
                })
                .then((data) => {
                    setSubjects(data);
                    setIsLoading(false);  // Set loading state to false when data is fetched
                })
                .catch((err) => {
                    setError(err.message);  // Set error state if fetch fails
                    setIsLoading(false);  // Set loading state to false when fetch fails
                });
        }
    }, [user_id]);

    return (
        <div>
            <label htmlFor="subject">Select Subject</label>
            {isLoading ? (
                <p>Loading...</p>  // Display loading message
            ) : error ? (
                <p>Error: {error}</p>  // Display error message
            ) : (
                <select
                    id="subject"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                >
                    <option value="">Choose Subject</option>
                    {subjects.map((subject) => (
                        <option key={subject.id} value={subject.name}>
                            {subject.name}
                        </option>
                    ))}
                </select>
            )}
        </div>
    );
};

export default SubjectDropdown;
