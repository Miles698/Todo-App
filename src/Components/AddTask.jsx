// your imports stay the same...
import React, { useRef, useState, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Chip } from "primereact/chip";
import { Calendar } from "primereact/calendar";
import { Menu } from "primereact/menu";
import { Divider } from "primereact/divider";
import "./AddTask.css";
import DescriptionOverlay from "./DescriptionOverlay";
import { normalizeProject } from "./utils";

export default function AddTask({
  tasks,
  setTasks,
  handleCompleteTask,
  defaultProject,
  hideHeading = false,
}) {
  const [task, setTask] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
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

  const menu = useRef(null);
  const reminderMenu = useRef(null);
  const [descOverlayVisible, setDescOverlayVisible] = useState(false);
  const [currentDescription, setCurrentDescription] = useState("");

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
    const updated = [...tasks];
    updated[index] = {
      ...updated[index],
      [key]: !updated[index][key],
    };
    setTasks(updated);
  };

  const handleAddComment = (index) => {
    const updated = [...tasks];
    const text = updated[index].commentInput?.trim();
    if (text) {
      updated[index].comments.push(text);
      updated[index].commentInput = "";
      setTasks(updated);
    }
  };

  const handleCommentEnter = (e, index) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddComment(index);
    }
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
      id: Date.now(),
      title: cleanedTitle,
      description,
      projects: finalProjects,
      date: dueDate.toISOString(),
      inboxOnly: finalProjects.includes("#Inbox"),
      priority,
      reminder:
        reminder === "datetime"
          ? reminderTime?.toISOString()
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
      const updated = [...tasks];
      updated[editTaskIndex] = newTask;
      setTasks(updated);
    } else {
      setTasks((prev) => [...prev, newTask]);
    }

    setTask("");
    setDescription("");
    setPriority({ level: 4, label: "⚪ Priority 4" });
    setReminder(null);
    setReminderTime(null);
    setDueDate(new Date());
    setShowCalendar(false);
    setShowForm(false);
    setEditingProject(false);
    setProjects([normalizeProject(defaultProject)]);
    setIsEditing(false);
    setEditTaskIndex(null);
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
                      {" • ⏰ "}
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
                  style={{ marginRight: "0.5rem", cursor: "pointer" }}
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
                  style={{ marginRight: "0.5rem", cursor: "pointer" }}
                  onClick={() => toggleTaskProperty(index, "showDateEditor")}
                />
                <i
                  className="pi pi-comment"
                  title="Toggle Comments"
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleTaskProperty(index, "showComments")}
                />
              </div>
            </div>

            {t.showDateEditor && (
              <Calendar
                value={new Date(t.date)}
                onChange={(e) => {
                  const updated = [...tasks];
                  updated[index].date = e.value.toISOString();
                  updated[index].showDateEditor = false;
                  setTasks(updated);
                }}
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
                    value={t.commentInput}
                    onChange={(e) => {
                      const updated = [...tasks];
                      updated[index].commentInput = e.target.value;
                      setTasks(updated);
                    }}
                    placeholder="Add a comment..."
                    onKeyDown={(e) => handleCommentEnter(e, index)}
                    style={{ width: "100%" }}
                  />
                  <Button
                    icon="pi pi-arrow-right"
                    className="p-button-text p-button-sm"
                    style={{ marginLeft: "0.5rem" }}
                    onClick={() => handleAddComment(index)}
                    disabled={!t.commentInput?.trim()}
                  />
                </span>

                {t.comments?.length > 0 && (
                  <ul className="comment-list">
                    {t.comments.map((c, i) => (
                      <li key={i} className="comment-item">
                        💬 {c}
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
            {!showCalendar ? (
              <Chip
                label={dueDate.toLocaleDateString()}
                removable
                onRemove={() => setShowCalendar(true)}
                icon="pi pi-calendar"
              />
            ) : (
              <Calendar
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.value);
                  setShowCalendar(false);
                }}
                showIcon
              />
            )}

            <Menu model={priorityOptions} popup ref={menu} />
            <Chip
              label={priority.label}
              onClick={(e) => menu.current.toggle(e)}
              className="priority-chip"
            />

            <Menu model={reminderOptions} popup ref={reminderMenu} />
            <Chip
              label="Reminders"
              icon="pi pi-bell"
              onClick={(e) => reminderMenu.current.toggle(e)}
            />

            {reminder === "datetime" && (
              <Calendar
                showTime
                value={reminderTime}
                onChange={(e) => setReminderTime(e.value)}
                placeholder="Select reminder time"
              />
            )}
          </div>

          <div className="task-footer">
            {!editingProject ? (
              <Chip
                label={projects.join(", ")}
                icon="pi pi-folder"
                onClick={() => setEditingProject(true)}
              />
            ) : (
              <InputText
                autoFocus
                value={projects.join(", ")}
                onChange={(e) =>
                  setProjects(
                    e.target.value
                      .split(/,\s*/)
                      .map((p) => (p.startsWith("#") ? p : "#" + p))
                  )
                }
                onBlur={() => setEditingProject(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setEditingProject(false);
                }}
              />
            )}

            <div className="form-buttons">
              <Button
                label="Cancel"
                className="p-button-text"
                onClick={() => {
                  setTask("");
                  setDescription("");
                  setReminder(null);
                  setReminderTime(null);
                  setDueDate(new Date());
                  setPriority({ level: 4, label: "⚪ Priority 4" });
                  setShowForm(false);
                  setEditingProject(false);
                  setProjects([
                    defaultProject ? `#${defaultProject}` : "#Inbox",
                  ]);
                  setIsEditing(false);
                  setEditTaskIndex(null);
                }}
              />
              <Button
                label={isEditing ? "Update Task" : "Add Task"}
                className="p-button-danger"
                onClick={handleAddClick}
              />
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
