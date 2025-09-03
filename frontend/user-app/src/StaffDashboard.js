import React, { useState, useEffect } from 'react';
import './StaffDashboard.css'; // Make sure this CSS file exists

const StaffDashboard = ({ staffDetails, onLogout }) => {
    const [assignments, setAssignments] = useState([]);
    const [year, setYear] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [subject, setSubject] = useState('');
    const [assignmentNumber, setAssignmentNumber] = useState('');

    useEffect(() => {
        fetch(`http://localhost:5000/subjects?name=${staffDetails.name}`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setSubjects(data);
                    if (data.length === 1) setSubject(data[0]);
                }
            })
            .catch((err) => console.error('Error fetching subjects:', err));
    }, [staffDetails.name]);

    const fetchAssignments = () => {
        if (year && subject && assignmentNumber) {
            fetch(
                `http://localhost:5000/assignments?year=${year}&subject=${subject}&assignmentNumber=${assignmentNumber}`
            )
                .then((res) => res.json())
                .then((data) => setAssignments(data))
                .catch((err) => console.error('Error fetching assignments:', err));
        } else {
            alert('Please select Year, Subject, and Assignment Number to fetch assignments.');
        }
    };

    return (
        <div className="dashboard-container">
            <nav className="navbar">
                <button className="logout-btn" onClick={onLogout}>
                    Logout
                </button>
            </nav>

            <div className="content-container">
                <header className="welcome-header">
                    <h1>Welcome, {staffDetails.name}</h1>
                    <p>Select a year and subject to view assignments.</p>
                </header>

                <div className="filter-section">
                    <div className="filter-group">
                        <label htmlFor="year">Select Year</label>
                        <select
                            id="year"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                        >
                            <option value="">Choose Year</option>
                            <option value="2021">2021</option>
                            <option value="2022">2022</option>
                            <option value="2023">2023</option>
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="subject">Select Subject</label>
                        {subjects.length > 1 ? (
                            <select
                                id="subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            >
                                <option value="">Choose Subject</option>
                                {subjects.map((subj) => (
                                    <option key={subj} value={subj}>
                                        {subj}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                id="subject"
                                value={subjects[0] || ''}
                                readOnly
                            />
                        )}
                    </div>

                    <div className="filter-group">
                        <label htmlFor="assignmentNumber">Select Assignment Number</label>
                        <select
                            id="assignmentNumber"
                            value={assignmentNumber}
                            onChange={(e) => setAssignmentNumber(e.target.value)}
                        >
                            <option value="">Choose Assignment</option>
                            <option value="1">Assignment 1</option>
                            <option value="2">Assignment 2</option>
                            <option value="3">Assignment 3</option>
                        </select>
                    </div>
                </div>

                <button className="fetch-btn" onClick={fetchAssignments}>
                    Fetch Assignments
                </button>

                <div className="assignments-section">
                <h2>Assignments</h2>
                {assignments.length === 0 ? (
                    <div className="no-assignments">No assignments found.</div>
                ) : (
                    <table className="assignments-table">
                        <thead>
                            <tr>
                                <th>USN</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Title</th>
                                <th>Description</th>
                                <th>File</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignments.map((assignment) => (
                                <tr key={assignment.id}>
                                    <td>{assignment.usn}</td>
                                    <td>{assignment.name}</td>
                                    <td>{assignment.category}</td>
                                    <td>{assignment.title}</td>
                                    <td>{assignment.description}</td>
                                    <td>
                                        <a
                                            href={`http://localhost:5000/uploads/${subject}/${assignment.file}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {assignment.file}
                                        </a>
                                    </td>
                                    <td>
                                        {assignment.submission ? 'Not Submitted' : 'Submitted'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            </div>
        </div>
    );
};

export default StaffDashboard;
