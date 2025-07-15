import React from "react";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import "./Sidebar.css";

const Sidebar = ({ tasks, onOpenSearch, activeTab, setActiveTab, onToggleNotifications }) => {
  const uniqueProjects = [...new Set(tasks.map((t) => t.project))].filter(Boolean).sort();

  const menuItems = [
    { label: "Add Task", icon: "pi-plus-circle" },
    { label: "Search", icon: "pi-search" },
    { label: "Today", icon: "pi-calendar" },
    { label: "Inbox", icon: "pi-inbox" },
    { label: "Upcoming", icon: "pi-calendar-plus" },
    { label: "Completed", icon: "pi-check-circle" },
    { label: "Filters & Labels", icon: "pi-sliders-h" },
  ];

  const handleMenuClick = (label) => {
    if (label === "Search") {
      onOpenSearch();
    } else {
      setActiveTab(label);
    }
  };

  return (
    <div className="sidebar">
      {/* 🔝 Top Section */}
      <div className="sidebar-top">
        <Avatar label="M" shape="circle" size="large" />
        <span className="username">Miles AyKays</span>
        <Button
          icon="pi pi-bell"
          className="p-button-rounded p-button-text notification-btn"
          aria-label="Notifications"
          onClick={onToggleNotifications}
        />
      </div>

      {/* 📋 Main Menu */}
      <div className="sidebar-menu">
        {menuItems.map(({ label, icon }) => (
          <div
            key={label}
            className={`menu-item-wrapper ${activeTab === label ? "active" : ""}`}
          >
            <Button
              label={label}
              icon={`pi ${icon}`}
              className="p-button-text"
              onClick={() => handleMenuClick(label)}
            />
          </div>
        ))}
      </div>

      {/* 📁 Projects */}
      {uniqueProjects.length > 0 && (
        <div className="project-list">
          <h4 className="project-heading">My Projects</h4>
          <ul>
            {uniqueProjects.map((project) => (
              <li key={project} className="project-item">
                #{project}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 🔻 Bottom Actions */}
      <div className="sidebar-bottom">
        <Button
          label="Add a Team"
          icon="pi pi-users"
          className="p-button-text"
        />
        <Button
          label="Help & Resources"
          icon="pi pi-question-circle"
          className="p-button-text"
        />
      </div>
    </div>
  );
};

export default Sidebar;
