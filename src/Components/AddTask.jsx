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
 const [tags, setTags] = useState(["urgent", "followup", "client"]);

  const [hashSuggestions, setHashSuggestions] = useState([]);
  const [showHashSuggestions, setShowHashSuggestions] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const [slashSuggestions, setSlashSuggestions] = useState([]);
  const [showSlashSuggestions, setShowSlashSuggestions] = useState(false);
  const [atSuggestions, setAtSuggestions] = useState([]);
  const [showAtSuggestions, setShowAtSuggestions] = useState(false);
  const [editField, setEditField] = useState({}); // e.g., { taskId: 'priority' }

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

  const getHighlightedText = (text) => {
    // Regex to match: #tags, /slash, @mentions, p1–p4, duration (e.g., 30m, 1h), time (e.g., 3pm)
    const regex =
      /(#\w+|\/\w+|@\w+|\b(p[1-4])\b|\b(\d+(m|h))\b|\b\d{1,2}(am|pm)\b)/gi;

    return text.replace(regex, (match) => {
      return `<span class="highlight">${match}</span>`;
    });
  };

  const containerRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setEditField({}); // Clicked outside, close all edits
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setEditField]);

  // Helper to parse natural language dates
  const parseNaturalDate = (text, currentDueDate) => {
    let newDate = new Date(currentDueDate); // Start with current due date to preserve time if not specified
    let cleanedText = text;

    // "tomorrow"
    if (/\btomorrow\b/i.test(cleanedText)) {
      newDate.setDate(newDate.getDate() + 1);
      cleanedText = cleanedText.replace(/\btomorrow\b/i, "").trim();
    }
    // "today" (if present and not already tomorrow, just ensure date is today)
    else if (/\btoday\b/i.test(cleanedText)) {
      const today = new Date();
      // Only adjust if the current newDate is not already today's date
      if (newDate.toDateString() !== today.toDateString()) {
        newDate.setFullYear(today.getFullYear());
        newDate.setMonth(today.getMonth());
        newDate.setDate(today.getDate());
      }
      cleanedText = cleanedText.replace(/\btoday\b/i, "").trim();
    }
    // "next week"
    else if (/\bnext week\b/i.test(cleanedText)) {
      newDate.setDate(newDate.getDate() + 7);
      cleanedText = cleanedText.replace(/\bnext week\b/i, "").trim();
    }
    // "in X days" or "in X weeks"
    const inXMatch = cleanedText.match(/\bin (\d+)\s*(day|week)s?\b/i);
    if (inXMatch) {
      const num = parseInt(inXMatch[1]);
      const unit = inXMatch[2].toLowerCase();
      if (unit === "day") {
        newDate.setDate(newDate.getDate() + num);
      } else if (unit === "week") {
        newDate.setDate(newDate.getDate() + num * 7);
      }
      cleanedText = cleanedText
        .replace(/\bin \d+\s*(day|week)s?\b/i, "")
        .trim();
    }

    return { cleanedText, parsedDate: newDate };
  };

  useEffect(() => {
    if (!task.trim()) return;

    let tempDueDate = new Date(dueDate); // Start with the current dueDate to preserve time if not explicitly changed

    // --- NEW/MODIFIED: Parse natural language dates as you type ---
    const { cleanedText: tempTask, parsedDate } = parseNaturalDate(
      task,
      tempDueDate
    );
    tempDueDate = parsedDate; // Update tempDueDate based on natural language
    // We update the state directly here if the date has changed from the current state
    if (dueDate.toDateString() !== tempDueDate.toDateString()) {
      setDueDate(tempDueDate);
    }
    // --- END NEW/MODIFIED ---

    // Priority setting via p1, p2...
    const priorityMatch = tempTask.match(/\bp([1-4])\b/i); // Use tempTask here
    if (priorityMatch) {
      const level = parseInt(priorityMatch[1]);
      setPriority({
        level,
        label:
          level === 1
            ? "🔴 Priority 1"
            : level === 2
            ? "🟠 Priority 2"
            : level === 3
            ? "🟡 Priority 3"
            : "⚪ Priority 4",
      });
    }

    // Time match like "4:30pm" or "11am" (ensure this still works with tempDueDate)
    const timeOnlyMatch = tempTask.match(
      /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i
    ); // Use tempTask
    if (timeOnlyMatch) {
      const hour = parseInt(timeOnlyMatch[1]);
      const minute = parseInt(timeOnlyMatch[2] || "0");
      const ampm = timeOnlyMatch[3].toLowerCase();
      let h = hour;
      if (ampm === "pm" && h < 12) h += 12;
      if (ampm === "am" && h === 12) h = 0;

      const newDateWithTime = new Date(tempDueDate); // Use tempDueDate
      newDateWithTime.setHours(h);
      newDateWithTime.setMinutes(minute);
      newDateWithTime.setSeconds(0);
      setDueDate(newDateWithTime);
    }

    // Tags via @something
    const tagMatches = tempTask.match(/@\w+/g); // Use tempTask
    if (tagMatches) {
      setTags(tagMatches.map((tag) => tag.replace("@", "")));
    }
  }, [task, dueDate]); // Added dueDate to dependency array

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

  const extractTimeFromTask = (text) => {
    const timeRegex =
      /from\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s+to\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
    const match = text.match(timeRegex);

    if (!match) return { cleanedText: text, time: null };

    let [, fromHour, fromMin, fromMeridiem, toHour, toMin, toMeridiem] = match;

    fromHour = parseInt(fromHour);
    fromMin = parseInt(fromMin || "0");
    toHour = parseInt(toHour);
    toMin = parseInt(toMin || "0");

    // Handle am/pm logic
    const applyMeridiem = (h, meridiem) => {
      if (!meridiem) return h; // assume 24h
      meridiem = meridiem.toLowerCase();
      if (meridiem === "pm" && h < 12) return h + 12;
      if (meridiem === "am" && h === 12) return 0;
      return h;
    };

    const finalFromHour = applyMeridiem(fromHour, fromMeridiem);

    const time = { hour: finalFromHour, minute: fromMin };

    // Remove the same title
    const cleanedText = text.replace(timeRegex, "").replace(/\s+/g, " ").trim();

    return { cleanedText, time };
  };

  function parseTimeString(timeStr) {
    const match = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (!match) return null;

    let hour = parseInt(match[1], 10);
    let minute = parseInt(match[2] || "0", 10);
    const ampm = match[3]?.toLowerCase();

    if (ampm === "pm" && hour < 12) hour += 12;
    if (ampm === "am" && hour === 12) hour = 0;

    return { hour, minute };
  }

  const handleAddClick = () => {
    if (!task.trim()) {
      alert("Please enter a task title.");
      return;
    }

    let title = task.trim();
    let currentDueDate = dueDate; // Use the current dueDate state

    // --- NEW: Parse natural language dates first ---
    const { cleanedText: titleAfterDateParse, parsedDate } = parseNaturalDate(
      title,
      currentDueDate
    );
    title = titleAfterDateParse; // Update title with cleaned version
    currentDueDate = parsedDate; // Update the date based on natural language
    setDueDate(currentDueDate); // Update state to reflect changes if needed
    // --- END NEW ---

    let extractedProjects = [];
    let subcategory = null;
    let tags = [];
    let startTime = null;
    let endTime = null;
    let timeRangeLabel = null;

    // Extract #project
    const categoryMatch = title.match(/#\w+/);
    if (categoryMatch) {
      extractedProjects.push(normalizeProject(categoryMatch[0]));
    }

    // Extract /subcategory
    const subcatMatch = title.match(/\/(\w+)/);
    if (subcatMatch && extractedProjects.length > 0) {
      subcategory = `${extractedProjects[0]}/${subcatMatch[1]}`;
      extractedProjects.push(subcategory);
    }

    // Extract @tags
    const tagMatches = title.match(/@\w+/g);
    if (tagMatches) {
      tags = tagMatches.map((t) => t.replace("@", ""));
    }

    // Extract time like 5:00pm
    const timeOnlyMatch = title.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
    if (timeOnlyMatch) {
      let hour = parseInt(timeOnlyMatch[1]);
      let minute = parseInt(timeOnlyMatch[2] || "0");
      let ampm = timeOnlyMatch[3]?.toLowerCase();
      if (ampm === "pm" && hour < 12) hour += 12;
      if (ampm === "am" && hour === 12) hour = 0;

      startTime = new Date(currentDueDate); // Use the updated currentDueDate
      startTime.setHours(hour);
      startTime.setMinutes(minute);
      startTime.setSeconds(0);
      startTime.setMilliseconds(0);
    }

    // Extract duration like 10 min
    const durationMatch = title.match(/(\d{1,3})\s*(min|minutes)/i);
    if (durationMatch && startTime) {
      const minutes = parseInt(durationMatch[1]);
      endTime = new Date(startTime);
      endTime.setMinutes(startTime.getMinutes() + minutes);
      timeRangeLabel = `⏰ ${startTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })} – ${endTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    // Extract p1/p2/p3/p4
    const priorityMatch = title.match(/\bp([1-4])\b/i);
    let level = 4;
    if (priorityMatch) {
      level = parseInt(priorityMatch[1]);
    }
    const finalPriority = {
      level,
      label:
        level === 1
          ? "🔴 Priority 1"
          : level === 2
          ? "🟠 Priority 2"
          : level === 3
          ? "🟡 Priority 3"
          : "⚪ Priority 4",
    };

    // Clean the title text (ensure natural language date phrases are also removed)
    let cleanedTitle = title
      .replace(/#\w+/g, "")
      .replace(/\/\w+/g, "")
      .replace(/@\w+/g, "")
      .replace(/\bp[1-4]\b/i, "")
      .replace(/\b\d{1,2}(?::\d{2})?\s*(am|pm)\b/i, "")
      .replace(/\d{1,3}\s*(min|minutes)/i, "")
      .replace(/\s+/g, " ")
      .trim();

    const newTask = {
      title: cleanedTitle,
      description,
      projects:
        extractedProjects.length > 0
          ? extractedProjects
          : projects.length > 0
          ? projects.map(normalizeProject)
          : [normalizeProject(defaultProject)],
      date: currentDueDate?.toISOString(), // Use currentDueDate which might have been updated
      start: startTime ? startTime.toISOString() : null,
      end: endTime ? endTime.toISOString() : null,
      timeRangeLabel,
      inboxOnly: extractedProjects.includes("#Inbox"),
      priority: finalPriority,
      tags, // Ensure tags are passed here
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

  // Split tasks into incomplete and completed
  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <div className="add-task-wrapper">
      {!hideHeading && <h2 className="heading">Tasks</h2>}
      {!hideHeading && incompleteTasks.length > 0 && (
        <p className="task-count">
          {incompleteTasks.length} task{incompleteTasks.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Incomplete tasks */}
      <div className="task-list">
        {incompleteTasks.map((t, index) => (
          <div key={t.id} className="task-item-wrapper">
            {/* ...existing code for each task item, using index as before... */}
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
                <span
                  dangerouslySetInnerHTML={{
                    __html: t.title.replace(
                      /(#\w+|@\w+|\/\w+|\bp[1-4]\b|\b\d{1,2}(:\d{2})?\s*(am|pm)\b|\b\d+\s*(min|minutes)\b)/gi,
                      (match) => `<span class="task-highlight">${match}</span>`
                    ),
                  }}
                />
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
                <div
                  ref={containerRef}
                  className="task-meta"
                  style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
                >
                  <div onClick={() => setEditField({ [t.id]: "date" })}>
                    {editField[t.id] === "date" ? (
                      <Calendar
                        value={new Date(t.date)}
                        onChange={(e) => {
                          onEditTask(t.id, { date: e.value.toISOString() });
                          setEditField({});
                        }}
                        showTime
                        hourFormat="24"
                      />
                    ) : (
                      new Date(t.date).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    )}
                  </div>
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
                  {t.tags && t.tags.length > 0 && (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {t.tags.map((tag, tagIndex) => (
                        <Chip
                          key={tagIndex}
                          label={`@${tag}`}
                          className="tag-chip"
                        />
                      ))}
                    </div>
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
                    setEditTaskIndex(tasks.findIndex((tk) => tk.id === t.id));
                    setShowForm(true);
                  }}
                />
                <i
                  className="pi pi-calendar"
                  title="Change Date"
                  onClick={() =>
                    toggleTaskProperty(
                      tasks.findIndex((tk) => tk.id === t.id),
                      "showDateEditor"
                    )
                  }
                />
                <i
                  className="pi pi-comment"
                  title="Toggle Comments"
                  onClick={() =>
                    toggleTaskProperty(
                      tasks.findIndex((tk) => tk.id === t.id),
                      "showComments"
                    )
                  }
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
                    onKeyDown={(e) =>
                      handleCommentEnter(
                        e,
                        tasks.findIndex((tk) => tk.id === t.id)
                      )
                    }
                    style={{ width: "100%" }}
                  />
                  <Button
                    icon="pi pi-arrow-right"
                    className="p-button-text p-button-sm"
                    style={{ marginLeft: "0.5rem", color: "grey" }}
                    onClick={() =>
                      handleAddComment(tasks.findIndex((tk) => tk.id === t.id))
                    }
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

      {/* Completed tasks section */}
      {completedTasks.length > 0 && (
        <div className="completed-section">
          <h4>Completed</h4>
          <div className="task-list completed-list">
            {completedTasks.map((t, index) => (
              <div key={t.id} className="task-item-wrapper completed">
                <div className="task-item">
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={() => handleCompleteTask(t.id)}
                  />
                  <span
                    className="task-title completed"
                    onClick={() => {
                      if (t.description) {
                        setCurrentDescription(t.description);
                        setDescOverlayVisible(true);
                      }
                    }}
                  >
                    <span
                      dangerouslySetInnerHTML={{
                        __html: t.title.replace(
                          /(#\w+|@\w+|\/\w+|\bp[1-4]\b|\b\d{1,2}(:\d{2})?\s*(am|pm)\b|\b\d+\s*(min|minutes)\b)/gi,
                          (match) =>
                            `<span class="task-highlight">${match}</span>`
                        ),
                      }}
                    />
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
                    <div
                      className="task-meta"
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <div onClick={() => setEditField({ [t.id]: "date" })}>
                        {editField[t.id] === "date" ? (
                          <Calendar
                            value={new Date(t.date)}
                            onChange={(e) => {
                              onEditTask(t.id, { date: e.value.toISOString() });
                              setEditField({});
                            }}
                            showTime
                            hourFormat="24"
                          />
                        ) : (
                          new Date(t.date).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        )}
                      </div>
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
                      {t.tags && t.tags.length > 0 && (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          {t.tags.map((tag, tagIndex) => (
                            <Chip
                              key={tagIndex}
                              label={`@${tag}`}
                              className="tag-chip"
                            />
                          ))}
                        </div>
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
                        setEditTaskIndex(
                          tasks.findIndex((tk) => tk.id === t.id)
                        );
                        setShowForm(true);
                      }}
                    />
                    <i
                      className="pi pi-calendar"
                      title="Change Date"
                      onClick={() =>
                        toggleTaskProperty(
                          tasks.findIndex((tk) => tk.id === t.id),
                          "showDateEditor"
                        )
                      }
                    />
                    <i
                      className="pi pi-comment"
                      title="Toggle Comments"
                      onClick={() =>
                        toggleTaskProperty(
                          tasks.findIndex((tk) => tk.id === t.id),
                          "showComments"
                        )
                      }
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
                        onKeyDown={(e) =>
                          handleCommentEnter(
                            e,
                            tasks.findIndex((tk) => tk.id === t.id)
                          )
                        }
                        style={{ width: "100%" }}
                      />
                      <Button
                        icon="pi pi-arrow-right"
                        className="p-button-text p-button-sm"
                        style={{ marginLeft: "0.5rem", color: "grey" }}
                        onClick={() =>
                          handleAddComment(
                            tasks.findIndex((tk) => tk.id === t.id)
                          )
                        }
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
        </div>
      )}

      {!showForm ? (
        <Button
          label="Add task"
          icon="pi pi-plus"
          onClick={() => setShowForm(true)}
          className="p-button-danger"
        />
      ) : (
        <div className="task-form">
          <div className="highlight-input-wrapper">
            <div
              className="highlighted-content"
              dangerouslySetInnerHTML={{ __html: getHighlightedText(task) }}
            />
            <textarea
              className="highlighted-input"
              value={task}
              onChange={(e) => {
                const value = e.target.value;
                setTask(value);
                const cursor = e.target.selectionStart;
                setCursorPos(cursor);

                // @tag match
                const atMatch = value.slice(0, cursor).match(/@(\w*)$/);
                if (atMatch) {
                  const query = atMatch[1].toLowerCase();
                  const suggestions = tags.filter((t) =>
                    t.toLowerCase().startsWith(query)
                  );
                  setAtSuggestions(suggestions);
                  setShowAtSuggestions(true);
                } else {
                  setShowAtSuggestions(false);
                }

                // Match for #
                const hashMatch = value.slice(0, cursor).match(/#(\w*)$/);
                if (hashMatch) {
                  const query = hashMatch[1].toLowerCase();
                  const suggestions = allProjects.filter((p) =>
                    p.toLowerCase().startsWith(`#${query}`)
                  );
                  setHashSuggestions(suggestions);
                  setShowHashSuggestions(true);
                } else {
                  setShowHashSuggestions(false);
                }

                // Match for /
                const slashMatch = value.slice(0, cursor).match(/\/(\w*)$/);
                if (slashMatch) {
                  const query = slashMatch[1].toLowerCase();
                  const suggestions = allProjects.filter((p) =>
                    p.toLowerCase().startsWith(`/${query}`)
                  );
                  setSlashSuggestions(suggestions);
                  setShowSlashSuggestions(true);
                } else {
                  setShowSlashSuggestions(false);
                }
              }}
              placeholder="e.g. Plan meeting #Work"
            />
          </div>

          {showHashSuggestions && hashSuggestions.length > 0 && (
            <div className="suggestions-panel">
              {hashSuggestions.map((s, i) => (
                <div
                  key={i}
                  className="suggestion-item"
                  onClick={() => {
                    // Replace current #word with selected suggestion
                    const before = task.slice(0, cursorPos).replace(/#\w*$/, s);
                    const after = task.slice(cursorPos);
                    setTask(before + after);
                    setShowHashSuggestions(false);
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
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

          {showAtSuggestions && atSuggestions.length > 0 && (
            <div className="suggestions-panel">
              {atSuggestions.map((s, i) => (
                <div
                  key={i}
                  className="suggestion-item"
                  onClick={() => {
                    const before = task
                      .slice(0, cursorPos)
                      .replace(/@\w*$/, `@${s}`);
                    const after = task.slice(cursorPos);
                    setTask(before + after);
                    setShowAtSuggestions(false);
                  }}
                >
                  @{s}
                </div>
              ))}
            </div>
          )}

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
