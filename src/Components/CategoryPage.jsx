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
  const [tags, setTags] = useState([]);
  const [cursorPos, setCursorPos] = useState(0);
  const [slashSuggestions, setSlashSuggestions] = useState([]);
  const [showSlashSuggestions, setShowSlashSuggestions] = useState(false);
  const [editField, setEditField] = useState({});
  const containerRef = useRef(null);
  const allProjects = [...new Set(tasks.flatMap((t) => t.projects || []))];
  const inputRef = useRef(null);
  const descriptionRef = useRef(null);

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
    const hashtags = text.match(/#\w+/g) || [];
    const subcats = text.match(/\/\w+/g) || [];
    const allProjects = [...hashtags, ...subcats];
    return allProjects.length > 0
      ? [...new Set(allProjects.map(normalizeProject))]
      : [];
  };

  const cleanTaskTitle = (text) => {
    return text
      .replace(/[#/]\w+/g, "") // Remove #project and /subcat
      .replace(/@\w+/g, "") // Remove @tags
      .replace(/\b(?:at\s*)?\d{1,2}(?::\d{2})?\s*(am|pm)?\b/gi, "") // Remove time
      .replace(/\bp[1-4]\b/gi, "") // Remove priority
      .replace(/\s+/g, " ") // Clean up extra spaces
      .trim();
  };

  const parseTimeString = (str) => {
    const match = str.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    if (!match) return null;

    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2] || "0", 10);
    const meridian = match[3]?.toLowerCase();

    if (meridian === "pm" && hour < 12) hour += 12;
    if (meridian === "am" && hour === 12) hour = 0;

    return { hour, minute };
  };

  const extractTagsFromTask = (text) => {
    const matches = text.match(/@\w+/g) || [];
    return matches.map((t) => t.slice(1));
  };

  const handleAddClick = () => {
    const taskTitle = task.trim();
    const taskDescription = description.trim();
    if (!taskTitle) return;

    // Priority parsing (e.g. p2 = Priority 2)
    const priorityMatch = taskTitle.match(/p([1-4])/i);
    const level = priorityMatch ? parseInt(priorityMatch[1]) : 4;
    const labels = {
      1: "🔴 Priority 1",
      2: "🟠 Priority 2",
      3: "🟡 Priority 3",
      4: "⚪ Priority 4",
    };
    const selectedPriority = { level, label: labels[level] };
    setPriority(selectedPriority); // Update UI state

    // Time parsing (e.g. "at 5pm", "5:30 AM")
    let startDate = new Date(dueDate);
    const timeMatch = taskTitle.match(
      /(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i
    );
    if (timeMatch) {
      const [, hourStr, minuteStr, period] = timeMatch;
      let hour = parseInt(hourStr, 10);
      const minutes = minuteStr ? parseInt(minuteStr, 10) : 0;

      if (period?.toLowerCase() === "pm" && hour < 12) hour += 12;
      else if (period?.toLowerCase() === "am" && hour === 12) hour = 0;

      startDate.setHours(hour);
      startDate.setMinutes(minutes);
      startDate.setSeconds(0);
      startDate.setMilliseconds(0);
      setDueDate(startDate); // Update UI state
    }

    // Project parsing via #tags
    const projectMatches = taskTitle.match(/#\w+/g);
    const normalizedProjects = projectMatches
      ? projectMatches.map((tag) => normalizeProject(tag))
      : [categoryName || "Inbox"];
    setProjects(normalizedProjects); // Update UI state

    // Final Task object
    const newTask = {
      id: Date.now(),
      title: cleanTaskTitle(taskTitle),
      description: taskDescription,
      date: startDate.toISOString(),
      priority: selectedPriority,
      projects: normalizedProjects,
      completed: false,
    };

    // Add and reset
    setTasks([...tasks, newTask]);
    resetForm();
  };

  const resetForm = () => {
    if (inputRef.current) inputRef.current.value = "";
    if (descriptionRef.current) descriptionRef.current.value = "";
    setTask("");
    setDescription("");
    setDueDate(new Date());
    setPriority({ level: 4, label: "⚪ Priority 4" });
    setReminder(null);
    setReminderTime(null);
    setIsEditing(false);
    setEditTaskIndex(null);
    setProjects(["Inbox"]);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setTask(value); // update live title

    // ✅ Priority parsing
    const priorityMatch = value.match(/p([1-4])/i);
    const level = priorityMatch ? parseInt(priorityMatch[1]) : 4;
    const labels = {
      1: "🔴 Priority 1",
      2: "🟠 Priority 2",
      3: "🟡 Priority 3",
      4: "⚪ Priority 4",
    };
    setPriority({ level, label: labels[level] });

    // ✅ Time parsing
    const timeMatch = value.match(
      /(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i
    );
    if (timeMatch) {
      const [, hourStr, minuteStr, period] = timeMatch;
      let hour = parseInt(hourStr, 10);
      const minutes = minuteStr ? parseInt(minuteStr, 10) : 0;

      if (period?.toLowerCase() === "pm" && hour < 12) hour += 12;
      if (period?.toLowerCase() === "am" && hour === 12) hour = 0;

      const newDate = new Date(dueDate);
      newDate.setHours(hour);
      newDate.setMinutes(minutes);
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      setDueDate(newDate); // ✅ update calendar
    }

    // ✅ Project parsing
    const projectMatches = value.match(/#\w+/g);
    const normalized = projectMatches?.map((tag) => normalizeProject(tag)) || [
      "Inbox",
    ];
    setProjects(normalized);
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

  const filteredTasks = tasks.filter((t) => {
    const normCategory = normalizeProject(categoryName);
    const normalizedProjects = t.projects?.map(normalizeProject) || [];
    return (
      normalizedProjects.some(
        (p) => p === normCategory || p.startsWith(normCategory + "/")
      ) &&
      !t.completed &&
      !t.inboxOnly
    );
  });

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

                  {/* Show time range if available */}
                  {t.start && t.end && (
                    <div className="text-sm text-gray-500 mt-1">
                      ⏰{" "}
                      {new Date(t.start).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}{" "}
                      –{" "}
                      {new Date(t.end).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  )}

                  {/* Existing metadata */}
                  <div
                    ref={containerRef}
                    className="task-meta"
                    style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
                  >
                    {/* 📅 Click-to-edit Date */}
                    <div onClick={() => setEditField({ [t.id]: "date" })}>
                      {editField[t.id] === "date" ? (
                        <Calendar
                          value={new Date(t.date)}
                          onChange={(e) => {
                            onEdit(t.id, "date", e.value);
                            setEditField({});
                          }}
                          showTime // ✅ shows time picker
                          hourFormat="24" // or "24" based on your preference
                        />
                      ) : (
                        new Date(t.date).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      )}
                    </div>

                    {/* 📁 Click-to-edit Project */}
                    <div onClick={() => setEditField({ [t.id]: "project" })}>
                      {editField[t.id] === "project" ? (
                        <input
                          type="text"
                          value={t.projects?.[0] || ""}
                          onChange={(e) => {
                            const value = normalizeProject(e.target.value);
                            onEditTask(t.id, { projects: [value] });
                          }}
                          onBlur={() => setEditField({})}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setEditField({});
                            }
                          }}
                          placeholder="#category or #category/sub"
                        />
                      ) : (
                        <span title="Click to edit project">
                          {t.projects?.join(", ")}
                        </span>
                      )}
                    </div>

                    {/* ⚠️ Click-to-edit Priority */}
                    <div onClick={() => setEditField({ [t.id]: "priority" })}>
                      {editField[t.id] === "priority" ? (
                        <select
                          value={t.priority.level}
                          onChange={(e) => {
                            const level = parseInt(e.target.value);
                            const label =
                              level === 1
                                ? "🔴 Priority 1"
                                : level === 2
                                ? "🟠 Priority 2"
                                : level === 3
                                ? "🟡 Priority 3"
                                : "⚪ Priority 4";
                            onEditTask(t.id, { priority: { level, label } });
                            setEditField({});
                          }}
                        >
                          <option value={1}>🔴 Priority 1</option>
                          <option value={2}>🟠 Priority 2</option>
                          <option value={3}>🟡 Priority 3</option>
                          <option value={4}>⚪ Priority 4</option>
                        </select>
                      ) : (
                        <span title="Click to edit priority">
                          {t.priority.label}
                        </span>
                      )}
                    </div>
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
            onChange={(e) => {
              handleInputChange(e); // 👈 your parsing logic
              const value = e.target.value;
              const pos = e.target.selectionStart;
              setCursorPos(pos);

              const slashMatch = value.slice(0, pos).match(/\/(\w*)$/);
              if (slashMatch) {
                const query = slashMatch[1].toLowerCase();
                const suggestions = allProjects.filter(
                  (p) =>
                    p.includes("/") && p.toLowerCase().includes(`/${query}`)
                );
                setSlashSuggestions(suggestions);
                setShowSlashSuggestions(true);
              } else {
                setShowSlashSuggestions(false);
              }
            }}
            placeholder="e.g. Plan meeting #Work"
            className="task-input"
          />

          {showSlashSuggestions && slashSuggestions.length > 0 && (
            <div className="suggestions-panel">
              {slashSuggestions.map((s, i) => (
                <div
                  key={i}
                  className="suggestion-item"
                  onClick={() => {
                    const before = task
                      .slice(0, cursorPos)
                      .replace(/\/\w*$/, s);
                    const after = task.slice(cursorPos);
                    setTask(before + after);
                    setShowSlashSuggestions(false);
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
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
              placeholder="Select date & time"
              showIcon
              showTime
              hourFormat="24" // or "24" based on your preference
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
            {projects.map((p, i) => (
              <Chip
                key={i}
                label={p}
                icon="pi pi-folder"
                className="project-chip"
                style={{ marginRight: "0.25rem" }}
              />
            ))}

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
