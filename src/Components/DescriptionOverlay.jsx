// Components/DescriptionOverlay.jsx
import React from "react";
import "./DescriptionOverlay.css";

const DescriptionOverlay = ({ visible, description, onClose }) => {
  if (!visible) return null;

  return (
    <div className="description-overlay">
      <div className="description-content">
        <div className="description-header">
          <h3>Task Description</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <p>{description}</p>
      </div>
    </div>
  );
};

export default DescriptionOverlay;
