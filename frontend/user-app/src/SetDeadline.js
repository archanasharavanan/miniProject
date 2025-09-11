import React, { useState, useEffect } from 'react';

const SetDeadline = () => {
    const [subjects, setSubjects] = useState([]);
    const [subject, setSubject] = useState('');
    const [batch, setBatch] = useState('');
    const [deadline, setDeadline] = useState('');
    const [deadlines, setDeadlines] = useState([]);

    const BACKEND_URL = process.env.NODE_ENV === 'production' 
        ? 'https://your-backend-url.com' // Replace with your actual backend URL
        : 'http://localhost:5000'; // Use localhost during development

    useEffect(() => {
        fetch(`${BACKEND_URL}/subjects`)
            .then((res) => res.json())
            .then((data) => setSubjects(data))
            .catch((err) => console.error('Error fetching subjects:', err));
    }, []);

    const saveDeadline = () => {
        fetch(`${BACKEND_URL}/deadlines`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject, batch, deadline }),
        })
            .then((res) => res.json())
            .then((data) => alert(data.message))
            .catch((err) => console.error('Error saving deadline:', err));
    };

    const fetchDeadlines = () => {
        fetch(`${BACKEND_URL}/deadlines`)
            .then((res) => res.json())
            .then((data) => setDeadlines(data))
            .catch((err) => console.error('Error fetching deadlines:', err));
    };

    return (
        <div>
            <h1>Set Deadline</h1>
            <div>
                <label>Subject</label>
                <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                    <option value="">Select Subject</option>
                    {subjects.map((subj) => (
                        <option key={subj} value={subj}>
                            {subj}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label>Batch</label>
                <select value={batch} onChange={(e) => setBatch(e.target.value)}>
                    <option value="">Select Batch</option>
                    <option value="2021">2021</option>
                    <option value="2022">2022</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                </select>
            </div>
            <div>
                <label>Deadline</label>
                <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                />
            </div>
            <button onClick={saveDeadline}>Save Deadline</button>
            <button onClick={fetchDeadlines}>View Deadlines</button>
            {deadlines.length > 0 && (
                <ul>
                    {deadlines.map((dl) => (
                        <li key={dl.id}>
                            {dl.subject} - {dl.batch} - {dl.deadline}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SetDeadline;
