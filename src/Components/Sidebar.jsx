import React, { useState, useEffect } from "react";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import "./Sidebar.css";

const Sidebar = ({
  tasks,
  onOpenSearch,
  activeTab,
  setActiveTab,
  onToggleNotifications,
  todayCount,
  upcomingCount,
  completedCount,
  customCategories,
  setCustomCategories,
  onCategoryClick,
}) => {
  const [categoryDialogVisible, setCategoryDialogVisible] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  // Extract unique project tags from tasks dynamically
  const dynamicCategories = Array.from(
    new Set(
      tasks
        .flatMap((task) => task.projects || [])
        .filter((proj) => proj !== "#Inbox")
    )
  ).sort();

  useEffect(() => {
    if (
      JSON.stringify(customCategories) !== JSON.stringify(dynamicCategories)
    ) {
      setCustomCategories(dynamicCategories);
    }
  }, [tasks]);

  const menuItems = [
    { label: "Add Task", icon: "pi pi-plus-circle" },
    { label: "Search", icon: "pi pi-search" },
    {
      label: todayCount > 0 ? `Today (${todayCount})` : "Today",
      icon: "pi pi-calendar",
      rawLabel: "Today",
    },
    { label: "Inbox", icon: "pi pi-inbox" },
    {
      label: upcomingCount > 0 ? `Upcoming (${upcomingCount})` : "Upcoming",
      icon: "pi pi-calendar-plus",
      rawLabel: "Upcoming",
    },
    {
      label: completedCount > 0 ? `Completed (${completedCount})` : "Completed",
      icon: "pi pi-check-circle",
      rawLabel: "Completed",
    },
    { label: "Filters & Labels", icon: "pi pi-sliders-h" },
  ];

  const handleMenuClick = (label) => {
    if (label === "Search") {
      onOpenSearch();
    } else {
      setActiveTab(label);
    }
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed.startsWith("#")) return;

    if (!customCategories.includes(trimmed)) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      if (onCategoryClick) onCategoryClick(trimmed);
      setActiveTab(trimmed);
    }

    setNewCategory("");
    setCategoryDialogVisible(false);
  };

  return (
    <div className="sidebar">
      {/* 👤 Profile Header */}
      <div className="sidebar-top">
        <Avatar label="M" shape="circle" size="large" />
        <span className="username">Miles AyKays</span>
        <Button
          icon="pi pi-bell"
          className="p-button-rounded p-button-text notification-btn"
          onClick={onToggleNotifications}
        />
      </div>

      {/* 📌 Sidebar Menu */}
      {menuItems.map(({ label, icon, rawLabel }) => {
        const base = rawLabel || label;
        return (
          <div
            key={label}
            className={`menu-item-wrapper ${
              activeTab === base ? "active" : ""
            }`}
          >
            <Button
              label={label}
              icon={icon}
              className="p-button-text"
              onClick={() => handleMenuClick(base)}
            />
          </div>
        );
      })}

      {/* 📁 My Projects */}
      <div className="project-list">
        <div
          className="project-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h4 className="project-heading" style={{ margin: 0 }}>
            My Projects
          </h4>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Button
              icon="pi pi-plus"
              className="p-button-rounded p-button-text gray-plus-icon"
              onClick={() => setCategoryDialogVisible(true)}
            />
            <i
              className={`pi ${
                projectsExpanded ? "pi-chevron-down" : "pi-chevron-right"
              }`}
              style={{ cursor: "pointer", fontSize: "1rem" }}
              onClick={() => setProjectsExpanded((prev) => !prev)}
            />
          </div>
        </div>

        {/* 🧾 Project List */}
        {projectsExpanded && (
          <ul>
            {customCategories.map((category) => {
              const count = tasks.filter(
                (task) =>
                  task.projects &&
                  task.projects.includes(category) &&
                  !task.completed &&
                  !task.inboxOnly
              ).length;

              return (
                <li
                  key={category}
                  onClick={() => {
                    setActiveTab(category);
                    if (onCategoryClick) onCategoryClick(category);
                  }}
                  className={activeTab === category ? "active" : ""}
                  style={{ cursor: "pointer" }}
                >
                  {category}{" "}
                  {count > 0 && (
                    <span style={{ color: "#999" }}>({count})</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ➕ Add Category Dialog */}
      <Dialog
        header="Add Project"
        visible={categoryDialogVisible}
        style={{ width: "30vw" }}
        onHide={() => setCategoryDialogVisible(false)}
        modal
      >
        <div
          className="p-fluid"
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <InputText
            placeholder="Project name (e.g. #Work)"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}
          >
            <Button
              label="Cancel"
              onClick={() => setCategoryDialogVisible(false)}
              className="p-button-outlined"
            />
            <Button
              label="Add"
              icon="pi pi-check"
              onClick={handleAddCategory}
              disabled={!newCategory.trim().startsWith("#")}
              className="p-button-danger"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Sidebar;
