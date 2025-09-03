import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Details.css";
import Modal from "./modal";
import { FaTrash } from "react-icons/fa";

const Details = ({ user, onLogout }) => {
  const [subject, setSubject] = useState("");
  const [assignment, setAssignment] = useState("");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [submittedAssignments, setSubmittedAssignments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false); 
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false); 
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
const [profilePicture, setProfilePicture] = useState(null);

const handleProfileClick = () => {
  setShowProfileMenu(false);
  setShowModal(true);
};

const handleProfileRightClick = (e) => {
  e.preventDefault();
  setShowModal(false);
  setShowProfileMenu(true);
};

const handleUploadPicture = (e) => {
  const file = e.target.files[0];
  if (file) {
    setProfilePicture(URL.createObjectURL(file));
    setShowProfileMenu(false);
  }
};

const handleRemovePicture = () => {
  setProfilePicture(null);
  setShowProfileMenu(false);
};

  useEffect(() => {
    const savedUser = user || JSON.parse(localStorage.getItem("user"));
    if (!savedUser) {
      navigate("/");
    } else {
      fetchAssignments(savedUser.id);
    }
  }, [user, navigate]);

  const fetchAssignments = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/assignments/${userId}`);
      const data = await response.json();
      setSubmittedAssignments(data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("user_id", user.id);
    formData.append("subject", subject);
    formData.append("assignment_number", assignment);
    formData.append("title", title);
    formData.append("category", category);
    formData.append("description", description);
    if (file) {
      formData.append("file", file);
    }

    try {
      const response = await fetch("http://localhost:5000/assignments", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        await fetchAssignments(user.id);

        setSubject("");
        setAssignment("");
        setCategory("");
        setTitle("");
        setDescription("");
        setFile(null);
      } else {
        console.error("Failed to submit assignment:", data.message);
      }
    } catch (error) {
      console.error("Error submitting assignment:", error);
    }
  };

  const handleDelete = async () => {
    if (!assignmentToDelete) return;

    try {
      const response = await fetch(`http://localhost:5000/assignments/${assignmentToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSubmittedAssignments((prevAssignments) =>
          prevAssignments.filter((assign) => assign.id !== assignmentToDelete.id)
        );
        setShowConfirmDelete(false);
      } else {
        console.error("Failed to delete assignment:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error during delete operation:", error);
    }
  };

  const handleLogout = () => {
    setShowConfirmLogout(true); // Show the logout confirmation modal
  };

  const confirmLogout = () => {
    onLogout(); // Trigger the logout action
    setShowConfirmLogout(false); // Close the logout confirmation modal
    navigate("/"); // Redirect to the login page or home page
  };

  const cancelLogout = () => {
    setShowConfirmLogout(false); // Close the logout confirmation modal
  };

  return (
    <div className="details-container">
      <div className="top-bar">
  <div
    className="profile-icon"
    onClick={handleProfileClick}
    onContextMenu={handleProfileRightClick}
  >
    {profilePicture ? (
      <img
        src={profilePicture}
        alt="Profile"
        className="profile-img"
      />
    ) : (
      "Profile"
    )}
  </div>
  {showProfileMenu && (
    <div className="profile-menu">
      <label htmlFor="upload-profile-picture" className="upload-label">
        Upload Picture
      </label>
      <input
        type="file"
        id="upload-profile-picture"
        style={{ display: "none" }}
        onChange={handleUploadPicture}
      />
      <button onClick={handleRemovePicture}>Remove Picture</button>
    </div>
  )}
  <button className="logout-button" onClick={handleLogout}>
    Logout
  </button>
</div>

      <Modal show={showModal} onClose={() => setShowModal(false)} user={user} />

      <h1>Assignment Form</h1>
      <form onSubmit={handleSubmit} className="assignment-form">
        <div className="input-row">
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          >
            <option value="">Subject</option>
            <option value="AI">AI</option>
            <option value="ADA">ADA</option>
            <option value="DBMS">DBMS</option>
            <option value="MERN">MERN</option>
          </select>
          <select
            value={assignment}
            onChange={(e) => setAssignment(e.target.value)}
            required
          >
            <option value="">Assignment</option>
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Category</option>
            <option value="Tech Talk">Tech Talk</option>
            <option value="Research">Research</option>
            <option value="Project">Project</option>
          </select>
        </div>
        <div className="input-group">
          <label>Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
        <label>Choose a file (PDF/Video):</label>
        <input
          type="file"
          accept=".pdf,.mp4"
          onChange={(e) => setFile(e.target.files[0])}
          required
        />
        {file && <span>{file.name}</span>}
      </div>

        <button type="submit">Submit</button>
      </form>

      <h2>Submitted Assignments</h2>
      <table className="assignments-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Assignment</th>
            <th>Title</th>
            <th>Category</th>
            <th>Description</th>
            <th>File Uploaded</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {submittedAssignments.map((assign) => (
            <tr key={assign.id}>
              <td>{assign.subject}</td>
              <td>{assign.assignment_number}</td>
              <td>{assign.title}</td>
              <td>{assign.category}</td>
              <td>{assign.description}</td>
              <td>
                {assign.file ? (
                  <a
                    href={`http://localhost:5000/uploads/${assign.subject}/${assign.file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {assign.file}
                  </a>
                ) : (
                  "No file uploaded"
                )}
              </td>
              <td>
                <FaTrash
                  className="icon delete-icon"
                  onClick={() => {
                    setAssignmentToDelete(assign);
                    setShowConfirmDelete(true);  // Show delete confirmation modal
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="confirm-delete-modal-overlay">
          <div className="confirm-delete-modal">
            <h2>Are you sure you want to delete this assignment?</h2>
            <button onClick={handleDelete}>Yes, Delete</button>
            <button onClick={() => setShowConfirmDelete(false)}>Cancel</button>
          </div>
        </div>
      )}

{showConfirmLogout && (
  <div className="confirm-logout-modal-overlay">
    <div className="confirm-logout-modal">
      <h2>Are you sure you want to logout?</h2>
      <div className="button-group">
        <button
          className="confirm-logout-button"
          onClick={confirmLogout}
        >
          Yes, Logout
        </button>
        <button
          className="cancel-logout-button"
          onClick={cancelLogout}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default Details;