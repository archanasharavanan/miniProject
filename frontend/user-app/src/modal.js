import React from 'react';
import './Modal.css';

const Modal = ({ show, onClose, user }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>Profile Information</h2>
        <div className="info-group">
          <span>Name:</span>
          <span>{user.name}</span>
        </div>
        <div className="info-group">
          <span>USN:</span>
          <span>{user.usn}</span>
        </div>
        <div className="info-group">
          <span>Semester:</span>
          <span>{user.semester}</span>
        </div>
        <div className="info-group">
          <span>Branch:</span>
          <span>{user.branch}</span>
        </div>
        <div className="info-group">
          <span>Batch:</span>
          <span>{user.batch}</span>
        </div>
        <button className="back-button" onClick={onClose}>Go Back</button>
      </div>
    </div>
  );
};

export default Modal;
