// ✅ CategoryPage.jsx (Fixed)
import React, { useState, useRef, useEffect } from "react";
import {
  InputText,
  Calendar,
  Button,
  InputTextarea,
  Chip,
  Menu,
  Divider,
} from "primereact";
import DescriptionOverlay from "./DescriptionOverlay";
import "./CategoryPage.css";
import { normalizeProject } from "./utils";

const CategoryPage = ({
  categoryName,
  tasks,
  setTasks,
  handleCompleteTask,
  defaultProject,
  handleEditTask,
  hideHeading = false,
  onAddTask,
}) => {
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
  const [projects, setProjects] = useState([normalizeProject(categoryName)]);
  const [isEditing, setIsEditing] = useState(false);
  const [editTaskIndex, setEditTaskIndex] = useState(null);

  const menu = useRef(null);
  const reminderMenu = useRef(null);
  const [descOverlayVisible, setDescOverlayVisible] = useState(false);
  const [currentDescription, setCurrentDescription] = useState("");

  useEffect(() => {
    setProjects([normalizeProject(categoryName)]);
  }, [categoryName]);

  const toggleTaskProperty = (index, prop) => {
    const updated = [...tasks];
    updated[index][prop] = !updated[index][prop];
    setTasks(updated);
  };

  const extractProjectsFromTask = (text) => {
    const matches = text.match(/#\w+/g);
    return matches ? [...new Set(matches.map(normalizeProject))] : [];
  };

  const handleAddClick = async () => {
    const extractedProjects = extractProjectsFromTask(task);
    const taskProjects =
      extractedProjects.length > 0 ? extractedProjects : projects;

    const updatedTask = {
      title: task,
      description,
      date: dueDate.toISOString(),
      priority,
      reminder:
        reminder === "before"
          ? "10 minutes before"
          : reminder === "datetime" && reminderTime
          ? reminderTime.toISOString()
          : null,
      projects: taskProjects,
    };

    const taskId = tasks[editTaskIndex]?.id;
    if (taskId) {
      await handleEditTask(taskId, updatedTask);
    } else {
      await onAddTask(updatedTask);
    }

    // Reset form
    resetForm();
  };

  const resetForm = () => {
    setTask("");
    setDescription("");
    setDueDate(new Date());
    setPriority({ level: 4, label: "⚪ Priority 4" });
    setReminder(null);
    setReminderTime(null);
    setProjects([normalizeProject(categoryName)]);
    setShowForm(false);
    setIsEditing(false);
    setEditTaskIndex(null);
  };

  const handleAddComment = async (idx) => {
    const updatedTasks = [...tasks];
    const task = updatedTasks[idx];
    const txt = task.commentInput?.trim();

    if (txt) {
      if (!Array.isArray(task.comments)) task.comments = [];
      task.comments.push(txt);
      task.commentInput = "";

      setTasks(updatedTasks);
      await handleEditTask(task.id, {
        comments: task.comments,
      });
    }
  };

  const handleCommentEnter = (e, idx) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddComment(idx);
    }
  };

  const filteredTasks = tasks.filter(
    (t) =>
      t.projects
        ?.map(normalizeProject)
        .includes(normalizeProject(categoryName)) &&
      !t.completed &&
      !t.inboxOnly
  );

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
      <h3>{categoryName}</h3>
      {!hideHeading && filteredTasks.length > 0 && (
        <p className="task-count">
          {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
        </p>
      )}

      <div className="task-list">
        {filteredTasks.map((t, idx) => {
          const globalIdx = tasks.findIndex((task) => task.id === t.id);
          return (
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
                    title="Edit"
                    onClick={() => {
                      setTask(t.title);
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
                      setEditTaskIndex(globalIdx);
                      setShowForm(true);
                    }}
                  />
                  <i
                    className="pi pi-calendar"
                    title="Change Date"
                    onClick={() =>
                      toggleTaskProperty(globalIdx, "showDateEditor")
                    }
                  />
                  <i
                    className="pi pi-comment"
                    title="Toggle Comments"
                    onClick={() =>
                      toggleTaskProperty(globalIdx, "showComments")
                    }
                  />
                </div>
              </div>

              {t.showDateEditor && (
                <div style={{ marginLeft: "2rem", marginTop: "0.5rem" }}>
                  <Calendar
                    value={new Date(t.date)}
                    onChange={(e) =>
                      handleEditTask(t.id, { date: e.value.toISOString() })
                    }
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
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <InputText
                      value={t.commentInput || ""}
                      onChange={(e) => {
                        const updated = [...tasks];
                        updated[globalIdx].commentInput = e.target.value;
                        setTasks(updated);
                      }}
                      placeholder="Add a comment..."
                      onKeyDown={(e) => handleCommentEnter(e, globalIdx)}
                      style={{ width: "100%" }}
                    />
                    <Button
                      icon="pi pi-arrow-right"
                      className="p-button-text p-button-sm"
                      style={{ marginLeft: "0.5rem", color: "grey" }}
                      onClick={() => handleAddComment(globalIdx)}
                      disabled={!t.commentInput?.trim()}
                    />
                  </div>
                  <ul
                    style={{
                      paddingLeft: "1rem",
                      fontSize: "14px",
                      marginTop: "0.5rem",
                    }}
                  >
                    {t.comments?.map((comment, i) => (
                      <li key={i}>- {comment}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Divider />
            </div>
          );
        })}
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
            autoResize
            className="task-description-input"
          />
          <div className="task-tags">
            <Calendar
              value={dueDate}
              onChange={(e) => setDueDate(e.value)}
              placeholder="Select due date"
              showIcon
              dateFormat="dd/mm/yy"
            />

            {/* Priority Menu */}
            <Menu model={priorityOptions} popup ref={menu} />
            <Chip
              label={priority.label}
              onClick={(e) => menu.current?.toggle(e)}
              className="priority-chip"
            />

            {/* Reminder Menu */}
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

            {/* Calendar for custom reminder */}
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
          <div className="task-footer">
            <Chip label={`#${categoryName}`} icon="pi pi-folder" />
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
      )}

      <DescriptionOverlay
        visible={descOverlayVisible}
        description={currentDescription}
        onClose={() => setDescOverlayVisible(false)}
      />
    </div>
  );
};

export default CategoryPage;
