import React, { useState } from "react";
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
}) => {
  const [categoryDialogVisible, setCategoryDialogVisible] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState("");
  const [customCategories, setCustomCategories] = useState({});

  const menuItems = [
    { label: "Add Task", icon: "pi-plus-circle" },
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

  const handleAddCategoryOrSub = () => {
    const cat = newCategory.trim();
    const sub = newSubcategory.trim();

    if (!cat.startsWith("#")) return;

    setCustomCategories((prev) => {
      const updated = { ...prev };
      if (!updated[cat]) updated[cat] = [];
      if (sub && sub.startsWith("/") && !updated[cat].includes(sub)) {
        updated[cat].push(sub);
      }
      return updated;
    });

    setNewCategory("");
    setNewSubcategory("");
    setCategoryDialogVisible(false);
  };

  // ✅ Collect all tags from both `project` and `projects` arrays
  const taskProjects = [
    ...new Set(
      tasks.flatMap((t) => {
        if (Array.isArray(t.projects)) return t.projects;
        if (typeof t.project === "string") return [t.project];
        return [];
      })
    ),
  ]
    .filter((p) => p && p.startsWith("#")) // Only valid project tags
    .map((p) => p.trim());

  // ✅ Build object { "#Work": [], "#Home": [] }
  const taskProjectMap = taskProjects.reduce((acc, tag) => {
    if (!acc[tag]) acc[tag] = [];
    return acc;
  }, {});

  // 🔀 Merge task-derived and custom-defined categories
  const mergedProjects = { ...taskProjectMap, ...customCategories };

  return (
    <div className="sidebar">
      {/* 🔝 Top Section */}
      <div className="sidebar-top">
        <Avatar label="M" shape="circle" size="large" />
        <span className="username">Miles AyKays</span>
        <Button
          icon="pi pi-bell"
          className="p-button-rounded p-button-text notification-btn"
          onClick={onToggleNotifications}
        />
      </div>

      {/* 📋 Menu */}
      {menuItems.map(({ label, icon, rawLabel }) => {
        const baseLabel = rawLabel || label;
        return (
          <div
            key={label}
            className={`menu-item-wrapper ${
              activeTab === baseLabel ? "active" : ""
            }`}
          >
            <Button
              label={label}
              icon={`pi ${icon}`}
              className="p-button-text"
              onClick={() => handleMenuClick(baseLabel)}
            />
          </div>
        );
      })}

      {/* 📁 My Projects */}
      <div className="project-list">
        <div
          className="project-header"
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          <h4 className="project-heading" style={{ marginTop: "4px" }}>
            My Projects
          </h4>
          <Button
            icon="pi pi-plus"
            className="p-button-rounded p-button-text gray-plus-icon"
            onClick={() => setCategoryDialogVisible(true)}
          />
        </div>

        <ul>
          {Object.entries(mergedProjects).map(([cat, subs]) => (
            <li key={cat} className="project-item">
              {cat}{" "}
              {subs.length > 0 && (
                <span style={{ color: "#888" }}>({subs.length})</span>
              )}
              {subs.length > 0 && (
                <ul className="subcategory-list" style={{ paddingLeft: "1rem" }}>
                  {subs.map((sub, i) => (
                    <li key={i} className="project-item sub">
                      {sub}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* ➕ Add Category/Subcategory Dialog */}
      <Dialog
        header="Add Category / Subcategory"
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
            placeholder="Category (e.g. #Work)"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <InputText
            placeholder="Subcategory (optional, e.g. /Frontend)"
            value={newSubcategory}
            onChange={(e) => setNewSubcategory(e.target.value)}
          />
          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}
          >
            <Button
              label="Cancel"
              onClick={() => setCategoryDialogVisible(false)}
              style={{
                backgroundColor: "white",
                color: "black",
                border: "1px solid #ccc",
              }}
            />
            <Button
              label="Add"
              icon="pi pi-check"
              onClick={handleAddCategoryOrSub}
              disabled={!newCategory.trim().startsWith("#")}
              style={{ backgroundColor: "red", color: "white", border: "none" }}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Sidebar;
