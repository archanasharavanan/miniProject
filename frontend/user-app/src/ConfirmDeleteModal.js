import React from 'react';

const ConfirmDeleteModal = ({ show, onClose, onConfirm }) => {
    if (!show) return null; // Don't render if not visible

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h3>Are you sure you want to delete this assignment?</h3>
                <div className="modal-buttons">
                    <button onClick={onConfirm}>Yes, Delete</button>
                    <button onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;
