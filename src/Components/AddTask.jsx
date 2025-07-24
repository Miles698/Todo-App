// ✅ Fully Updated AddTask.jsx
import React, { useRef, useState, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Chip } from "primereact/chip";
import { Calendar } from "primereact/calendar";
import { Menu } from "primereact/menu";
import { Divider } from "primereact/divider";
import DescriptionOverlay from "./DescriptionOverlay";
import { normalizeProject } from "./utils";
import { OverlayPanel } from "primereact/overlaypanel";

import "./AddTask.css";

export default function AddTask({
  tasks,
  onAddTask,
  onEditTask,
  handleCompleteTask,
  defaultProject,
  hideHeading = false,
  allProjects = [],
}) {
  const [task, setTask] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(new Date());
  const [priority, setPriority] = useState({
    level: 4,
    label: "⚪ Priority 4",
  });
  const [reminder, setReminder] = useState(null);
  const [reminderTime, setReminderTime] = useState(null);
  const [showForm, setShowForm] = useState(true);
  const [editingProject, setEditingProject] = useState(false);
  const [projects, setProjects] = useState([]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTaskIndex, setEditTaskIndex] = useState(null);
  const [descOverlayVisible, setDescOverlayVisible] = useState(false);
  const [currentDescription, setCurrentDescription] = useState("");
  const menu = useRef(null);
  const reminderMenu = useRef(null);
  const [selectedProject, setSelectedProject] = useState("#Inbox");
  const [filterText, setFilterText] = useState("");
  const op = useRef(null);

  // Extract unique custom projects from tasks (excluding #Inbox)
  const myProjects = allProjects.filter((p) => p && p !== "#Inbox");
  


  const handleProjectClick = (e) => {
    op.current.toggle(e);
  };

  const filteredProjects = myProjects.filter((project) =>
    project.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleSelectProject = (project) => {
    setSelectedProject(project);

    // 👇 If inbox selected, assign all "myProjects" as associated projects
    if (project === "#Inbox") {
      setProjects(["#Inbox", ...myProjects]);
    } else {
      setProjects([project]);
    }

    op.current.hide();
  };

  useEffect(() => {
    if (!isEditing && projects.length === 0) {
      setProjects([normalizeProject(defaultProject)]);
    }
  }, [defaultProject, isEditing]);

  const extractProjectsFromTask = (text) => {
    const matches = text.match(/#\w+/g);
    return matches ? matches.map(normalizeProject) : [];
  };

  const toggleTaskProperty = (index, key) => {
    const task = tasks[index];
    if (task) {
      onEditTask(task.id, { [key]: !task[key] });
    }
  };

  const saveEditedTask = async () => {
    const updatedTask = {
      title: task,
      description,
      date: dueDate?.toISOString(),
      priority,
      reminder:
        reminder === "datetime"
          ? reminderTime?.toISOString()
          : reminder === "before"
          ? "10 minutes before"
          : null,
      projects,
    };
    await onEditTask(tasks[editTaskIndex].id, updatedTask);
    resetForm();
  };

  const handleAddClick = () => {
    if (!task.trim()) {
      alert("Please enter a task title.");
      return;
    }

    const extractedProjects = extractProjectsFromTask(task);
    const cleanedTitle = task.replace(/#\w+/g, "").trim();
    const finalProjects =
      extractedProjects.length > 0
        ? extractedProjects
        : projects.length > 0
        ? projects.map(normalizeProject)
        : [normalizeProject(defaultProject)];

    const newTask = {
      title: cleanedTitle,
      description,
      projects: finalProjects,
      date: dueDate.toISOString(),
      inboxOnly: finalProjects.includes("#Inbox"),
      priority,
      reminder:
        reminder === "datetime"
          ? reminderTime instanceof Date
            ? reminderTime.toISOString()
            : null
          : reminder === "before"
          ? "10 minutes before"
          : null,
      showDescription: false,
      showDateEditor: false,
      showComments: false,
      commentInput: "",
      comments: [],
      completed: false,
    };

    if (isEditing && editTaskIndex !== null) {
      const id = tasks[editTaskIndex].id;
      onEditTask(id, newTask);
    } else {
      onAddTask(newTask);
    }

    // ✅ Update allProjects with any new tags
    const uniqueProjects = new Set([...allProjects, ...finalProjects]);
    setAllProjects(Array.from(uniqueProjects));

    resetForm();
  };

  const resetForm = () => {
    setTask("");
    setDescription("");
    setPriority({ level: 4, label: "⚪ Priority 4" });
    setReminder(null);
    setReminderTime(null);
    setDueDate(new Date());
    setShowForm(false);
    setEditingProject(false);
    setProjects([normalizeProject(defaultProject)]);
    setIsEditing(false);
    setEditTaskIndex(null);
  };

  const handleAddComment = (index) => {
    const task = tasks[index];
    if (task && task.commentInput?.trim()) {
      const updatedComments = [
        ...(task.comments || []),
        task.commentInput.trim(),
      ];
      onEditTask(task.id, { comments: updatedComments, commentInput: "" });
    }
  };

  const handleCommentEnter = (e, index) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddComment(index);
    }
  };

  const priorityOptions = [
    {
      label: "🔴 Priority 1",
      command: () => setPriority({ level: 1, label: "🔴 Priority 1" }),
    },
    {
      label: "🟠 Priority 2",
      command: () => setPriority({ level: 2, label: "🟠 Priority 2" }),
    },
    {
      label: "🟡 Priority 3",
      command: () => setPriority({ level: 3, label: "🟡 Priority 3" }),
    },
    {
      label: "⚪ Priority 4",
      command: () => setPriority({ level: 4, label: "⚪ Priority 4" }),
    },
  ];

  const reminderOptions = [
    { label: "Set Date & Time", command: () => setReminder("datetime") },
    { label: "10 minutes before", command: () => setReminder("before") },
    {
      label: "Clear Reminder",
      command: () => {
        setReminder(null);
        setReminderTime(null);
      },
    },
  ];

  return (
    <div className="add-task-wrapper">
      {!hideHeading && <h2 className="heading">Tasks</h2>}
      {!hideHeading && tasks.length > 0 && (
        <p className="task-count">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""}
        </p>
      )}

      <div className="task-list">
        {tasks.map((t, index) => (
          <div key={t.id} className="task-item-wrapper">
            <div className="task-item">
              <input
                type="checkbox"
                checked={t.completed}
                onChange={() => handleCompleteTask(t.id)}
              />
              <span
                className="task-title"
                onClick={() => {
                  if (t.description) {
                    setCurrentDescription(t.description);
                    setDescOverlayVisible(true);
                  }
                }}
              >
                {t.title}
                <div className="task-meta">
                  {new Date(t.date).toLocaleDateString()} •{" "}
                  {t.projects?.join(", ")} • {t.priority.label}
                  {t.reminder && (
                    <>
                      {" "}
                      • ⏰{" "}
                      {t.reminder === "10 minutes before"
                        ? t.reminder
                        : new Date(t.reminder).toLocaleString()}
                    </>
                  )}
                </div>
              </span>
              <div className="hover-actions">
                <i
                  className="pi pi-pencil"
                  title="Edit Task"
                  onClick={() => {
                    setTask(t.title + " " + t.projects?.join(" "));
                    setDescription(t.description);
                    setDueDate(new Date(t.date));
                    setPriority(t.priority);
                    setReminder(
                      t.reminder === "10 minutes before"
                        ? "before"
                        : t.reminder
                        ? "datetime"
                        : null
                    );
                    setReminderTime(
                      t.reminder && t.reminder !== "10 minutes before"
                        ? new Date(t.reminder)
                        : null
                    );
                    setProjects(t.projects);
                    setIsEditing(true);
                    setEditTaskIndex(index);
                    setShowForm(true);
                  }}
                />
                <i
                  className="pi pi-calendar"
                  title="Change Date"
                  onClick={() => toggleTaskProperty(index, "showDateEditor")}
                />
                <i
                  className="pi pi-comment"
                  title="Toggle Comments"
                  onClick={() => toggleTaskProperty(index, "showComments")}
                />
              </div>
            </div>

            {t.showDateEditor && (
              <Calendar
                value={new Date(t.date)}
                onChange={(e) =>
                  onEditTask(t.id, { date: e.value.toISOString() })
                }
                showTime
                hourFormat="12"
              />
            )}

            {t.showComments && (
              <div className="comment-box">
                <span
                  className="p-input-icon-right"
                  style={{ width: "100%", display: "flex" }}
                >
                  <InputText
                    value={t.commentInput || ""}
                    onChange={(e) =>
                      onEditTask(t.id, { commentInput: e.target.value })
                    }
                    placeholder="Add a comment..."
                    onKeyDown={(e) => handleCommentEnter(e, index)}
                    style={{ width: "100%" }}
                  />
                  <Button
                    icon="pi pi-arrow-right"
                    className="p-button-text p-button-sm"
                    style={{ marginLeft: "0.5rem", color: "grey" }}
                    onClick={() => handleAddComment(index)}
                    disabled={!t.commentInput?.trim()}
                  />
                </span>
                {t.comments?.length > 0 && (
                  <ul className="comment-list">
                    {t.comments.map((c, i) => (
                      <li key={i} className="comment-item">
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <Divider />
          </div>
        ))}
      </div>

      {!showForm ? (
        <Button
          label="Add task"
          icon="pi pi-plus"
          onClick={() => setShowForm(true)}
          className="p-button-danger"
        />
      ) : (
        <div className="task-form">
          <InputText
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="e.g. Plan meeting #Work"
            className="task-input"
          />
          <InputTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={2}
            className="task-description-input"
            autoResize
          />

          <div className="task-tags">
            <Calendar
              value={dueDate}
              onChange={(e) => setDueDate(e.value)}
              placeholder="Select due date"
              showIcon
              dateFormat="dd/mm/yy"
              showTime
            />

            <Menu model={priorityOptions} popup ref={menu} />
            <Chip
              label={priority.label}
              onClick={(e) => menu.current?.toggle(e)}
              className="priority-chip"
            />

            <Menu model={reminderOptions} popup ref={reminderMenu} />
            <Chip
              label={
                reminder === "datetime" && reminderTime
                  ? new Date(reminderTime).toLocaleString()
                  : reminder || "Reminders"
              }
              icon="pi pi-bell"
              onClick={(e) => reminderMenu.current?.toggle(e)}
            />

            {reminder === "datetime" && (
              <div style={{ marginTop: "0.5rem" }}>
                <Calendar
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.value)}
                  showTime
                  placeholder="Select reminder time"
                />
              </div>
            )}
          </div>

          <div style={{ padding: "1rem" }}>
            <div className="task-footer">
              <Chip
                label={selectedProject}
                icon="pi pi-folder"
                onClick={handleProjectClick}
                style={{ cursor: "pointer" }}
              />

              <OverlayPanel ref={op} dismissable>
                <div style={{ padding: "0.5rem", width: "250px" }}>
                  <InputText
                    placeholder="Type a project name"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="p-inputtext-sm"
                    style={{ width: "100%", marginBottom: "0.5rem" }}
                  />

                  <div
                    className="p-menuitem"
                    onClick={() => handleSelectProject("#Inbox")}
                    style={{
                      cursor: "pointer",
                      padding: "0.5rem",
                      backgroundColor:
                        selectedProject === "#Inbox"
                          ? "#f0f0f0"
                          : "transparent",
                      fontWeight:
                        selectedProject === "#Inbox" ? "bold" : "normal",
                    }}
                  >
                    <i
                      className="pi pi-inbox"
                      style={{ marginRight: "0.5rem" }}
                    />
                    Inbox
                    {selectedProject === "#Inbox" && (
                      <i className="pi pi-check" style={{ float: "right" }} />
                    )}
                  </div>

                  <div style={{ margin: "0.5rem 0", fontWeight: "bold" }}>
                    My Projects
                  </div>

                  {filteredProjects.length === 0 && (
                    <div style={{ padding: "0.5rem", color: "#888" }}>
                      No projects found.
                    </div>
                  )}

                  {filteredProjects.map((project, index) => (
                    <div
                      key={index}
                      className="p-menuitem"
                      onClick={() => handleSelectProject(project)}
                      style={{
                        cursor: "pointer",
                        padding: "0.5rem",
                        backgroundColor:
                          selectedProject === project
                            ? "#f0f0f0"
                            : "transparent",
                        fontWeight:
                          selectedProject === project ? "bold" : "normal",
                      }}
                    >
                      {project}
                      {selectedProject === project && (
                        <i className="pi pi-check" style={{ float: "right" }} />
                      )}
                    </div>
                  ))}
                </div>
              </OverlayPanel>
            

            <div className="form-buttons">
              <Button
                label="Cancel"
                className="p-button-text"
                onClick={resetForm}
              />
              <Button
                label={isEditing ? "Update Task" : "Add Task"}
                className="p-button-danger"
                onClick={handleAddClick}
              />
            </div>
          </div>
        </div>
        </div>
      )}

      <DescriptionOverlay
        visible={descOverlayVisible}
        description={currentDescription}
        onClose={() => setDescOverlayVisible(false)}
      />
    </div>
  );
}
