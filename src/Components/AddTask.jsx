import React, { useRef, useState } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Chip } from "primereact/chip";
import { Calendar } from "primereact/calendar";
import { Menu } from "primereact/menu";
import { Divider } from "primereact/divider";
import "./AddTask.css";
import DescriptionOverlay from "./DescriptionOverlay";

export default function AddTask({ tasks, setTasks, handleCompleteTask }) {
  const [task, setTask] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [priority, setPriority] = useState({ level: 4, label: "⚪ Priority 4" });
  const [reminder, setReminder] = useState(null);
  const [reminderTime, setReminderTime] = useState(null);
  const [showForm, setShowForm] = useState(true);
  const [editingProject, setEditingProject] = useState(false);
  const [projects, setProjects] = useState(["#Inbox"]);
  const [isEditing, setIsEditing] = useState(false);
  const [editTaskIndex, setEditTaskIndex] = useState(null);
  const menu = useRef(null);
  const reminderMenu = useRef(null);
  const [descOverlayVisible, setDescOverlayVisible] = useState(false);
  const [currentDescription, setCurrentDescription] = useState("");

  const extractProjectsFromTask = (text) => {
    const matches = text.match(/#\w+/g);
    return matches || ["#Inbox"];
  };

  const handleAddClick = () => {
    if (!task.trim()) {
      alert("Please enter a task title.");
      return;
    }

    const extractedProjects = extractProjectsFromTask(task);
    const cleanedTask = task.replace(/#\w+/g, "").trim();

    const newTask = {
      id: Date.now(),
      title: cleanedTask,
      description,
      projects: extractedProjects,
      date: dueDate.toISOString(),
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

    const updatedTasks = [...tasks];
    if (isEditing && editTaskIndex !== null) {
      updatedTasks[editTaskIndex] = newTask;
    } else {
      updatedTasks.push(newTask);
    }
    setTasks(updatedTasks);

    setTask("");
    setDescription("");
    setPriority({ level: 4, label: "⚪ Priority 4" });
    setReminder(null);
    setReminderTime(null);
    setDueDate(new Date());
    setShowCalendar(false);
    setShowForm(false);
    setEditingProject(false);
    setProjects(["#Inbox"]);
    setIsEditing(false);
    setEditTaskIndex(null);
  };

  const toggleTaskProperty = (index, property) => {
    const updated = [...tasks];
    updated[index][property] = !updated[index][property];
    setTasks(updated);
  };

  const updateTaskDate = (index, newDate) => {
    const updated = [...tasks];
    updated[index].date = newDate.toISOString();
    updated[index].showDateEditor = false;
    setTasks(updated);
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
    {
      label: "Set Date & Time",
      command: () => setReminder("datetime"),
    },
    {
      label: "10 minutes before",
      command: () => setReminder("before"),
    },
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
      <h2 className="heading">Today</h2>
      {tasks.length > 0 && (
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
                onChange={() => handleCompleteTask(t.id)}
                checked={t.completed}
                style={{ marginRight: "1rem" }}
              />
              <span
                className="task-title"
                onClick={() => {
                  if (t.description) {
                    setCurrentDescription(t.description);
                    setDescOverlayVisible(true);
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                {t.title}
                <div className="task-meta">
                  {new Date(t.date).toLocaleDateString()} • {t.projects?.join(" ")} • {t.priority.label}
                  {t.reminder &&
                    ` • ⏰ ${
                      t.reminder === "10 minutes before"
                        ? t.reminder
                        : new Date(t.reminder).toLocaleString()
                    }`}
                </div>
              </span>

              <div className="hover-actions">
                <i
                  className="pi pi-pencil"
                  title="Edit"
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
              <div style={{ marginLeft: "2rem", marginTop: "-0.5rem" }}>
                <Calendar
                  value={new Date(t.date)}
                  onChange={(e) => updateTaskDate(index, e.value)}
                  showIcon
                />
              </div>
            )}

            {t.showComments && (
              <div
                style={{
                  marginLeft: "2rem",
                  marginTop: "0.5rem",
                  width: "100%",
                }}
              >
                <InputText
                  placeholder="Add a comment and press Enter"
                  value={t.commentInput || ""}
                  onChange={(e) => {
                    const updated = [...tasks];
                    updated[index].commentInput = e.target.value;
                    setTasks(updated);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && t.commentInput?.trim()) {
                      const updated = [...tasks];
                      updated[index].comments.push(t.commentInput.trim());
                      updated[index].commentInput = "";
                      setTasks(updated);
                    }
                  }}
                  style={{ width: "100%" }}
                />
                <ul style={{ paddingLeft: "1rem", fontSize: "14px", marginTop: "0.5rem" }}>
                  {t.comments.map((comment, i) => (
                    <li key={i}>- {comment}</li>
                  ))}
                </ul>
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
          className="custom-add-task-btn"
          onClick={() => setShowForm(true)}
        />
      ) : (
        <div className="task-form">
          <InputText
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="e.g. Read book #Personal #Work"
            className="task-input"
          />
          <InputTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={2}
            autoResize
            className="description-input"
          />

          <div className="task-tags">
            {!showCalendar ? (
              <Chip
                label={dueDate.toLocaleDateString()}
                removable
                onRemove={() => setShowCalendar(true)}
                icon="pi pi-calendar"
                className="custom-chip"
              />
            ) : (
              <Calendar
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.value);
                  setShowCalendar(false);
                }}
                showIcon
                className="calendar-picker"
              />
            )}

            <Menu model={priorityOptions} popup ref={menu} />
            <Chip
              label={priority.label}
              className="custom-chip"
              onClick={(e) => menu.current.toggle(e)}
            />

            <Menu model={reminderOptions} popup ref={reminderMenu} />
            <Chip
              label="Reminders"
              icon="pi pi-bell"
              className="custom-chip"
              onClick={(e) => reminderMenu.current.toggle(e)}
            />

            {reminder === "datetime" && (
              <Calendar
                showTime
                value={reminderTime}
                onChange={(e) => setReminderTime(e.value)}
                placeholder="Select reminder time"
                className="calendar-picker"
              />
            )}
            {reminder === "before" && (
              <small style={{ fontSize: "12px", color: "#888" }}>
                Reminder set: 10 minutes before task
              </small>
            )}
          </div>

          <div className="task-footer">
            <div className="footer-left">
              {!editingProject ? (
                <Chip
                  label={projects.join(", ")}
                  icon="pi pi-folder"
                  className="custom-chip"
                  onClick={() => setEditingProject(true)}
                />
              ) : (
                <InputText
                  autoFocus
                  value={projects.join(", ")}
                  onChange={(e) => setProjects(e.target.value.split(/,\s*/).map(p => p.startsWith("#") ? p : "#" + p))}
                  onBlur={() => setEditingProject(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setEditingProject(false);
                    }
                  }}
                  className="project-input"
                />
              )}
            </div>

            <div className="form-buttons">
              <Button
                label="Cancel"
                className="p-button-text p-button-secondary"
                onClick={() => {
                  setTask("");
                  setDescription("");
                  setReminder(null);
                  setReminderTime(null);
                  setDueDate(new Date());
                  setPriority({ level: 4, label: "⚪ Priority 4" });
                  setShowForm(false);
                  setEditingProject(false);
                  setProjects(["#Inbox"]);
                  setIsEditing(false);
                  setEditTaskIndex(null);
                }}
              />
              <Button
                label={isEditing ? "Update task" : "Add task"}
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
