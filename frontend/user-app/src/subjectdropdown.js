import React, { useState, useEffect } from 'react';

const SubjectDropdown = ({ user_id, value, onChange }) => {
    const [subjects, setSubjects] = useState([]);

    useEffect(() => {
        if (user_id) {
            fetch(`http://localhost:5000/subjects?user_id=${user_id}`)
                .then((res) => res.json())
                .then((data) => setSubjects(data))
                .catch((err) => console.error('Error fetching subjects:', err));
        }
    }, [user_id]);

    return (
        <div>
            <label htmlFor="subject">Select Subject</label>
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
        </div>
    );
};

export default SubjectDropdown;
