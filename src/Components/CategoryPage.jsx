// CategoryPage.jsx
import React, { useState, useRef, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { Chip } from "primereact/chip";
import { Menu } from "primereact/menu";
import { Divider } from "primereact/divider";
import DescriptionOverlay from "./DescriptionOverlay";
import "./CategoryPage.css";
import { normalizeProject } from "./utils";

const CategoryPage = ({
  categoryName,
  tasks,
  setTasks,
  handleCompleteTask,
  defaultProject,
  hideHeading = false,
}) => {
  const [task, setTask] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [priority, setPriority] = useState({ level: 4, label: "⚪ Priority 4" });
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

  const updateTaskDate = (index, newDate) => {
    const updated = [...tasks];
    updated[index].date = newDate.toISOString();
    updated[index].showDateEditor = false;
    setTasks(updated);
  };

  const extractProjectsFromTask = (text) => {
    const matches = text.match(/#\w+/g);
    return matches ? [...new Set(matches.map(normalizeProject))] : [];
  };

  const handleAddClick = () => {
    if (!task.trim()) {
      alert("Please enter a task title.");
      return;
    }

    const extracted = extractProjectsFromTask(task);
    const cleaned = task.replace(/#\w+/g, "").trim();
    const finalProjects = extracted.length
      ? extracted
      : projects.length
      ? projects.map(normalizeProject)
      : [normalizeProject(categoryName)];

    const newTask = {
      id:
        isEditing && editTaskIndex !== null
          ? tasks[editTaskIndex].id
          : Date.now(),
      title: cleaned,
      description,
      projects: finalProjects,
      date: dueDate.toISOString(),
      inboxOnly: false,
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
      comments:
        isEditing && tasks[editTaskIndex].comments
          ? [...tasks[editTaskIndex].comments]
          : [],
      completed: false,
    };

    const updated = [...tasks];
    if (isEditing && editTaskIndex !== null) updated[editTaskIndex] = newTask;
    else updated.push(newTask);

    setTasks(updated);
    resetForm();
  };

  const resetForm = () => {
    setTask("");
    setDescription("");
    setDueDate(new Date());
    setPriority({ level: 4, label: "⚪ Priority 4" });
    setReminder(null);
    setReminderTime(null);
    setShowForm(false);
    setProjects([normalizeProject(categoryName)]);
    setIsEditing(false);
    setEditTaskIndex(null);
  };

  const handleCommentInputChange = (idx, val) => {
    const u = [...tasks];
    u[idx].commentInput = val;
    setTasks(u);
  };

  const handleAddComment = (idx) => {
    const u = [...tasks];
    const txt = u[idx].commentInput?.trim();
    if (txt) {
      if (!Array.isArray(u[idx].comments)) u[idx].comments = [];
      u[idx].comments.push(txt);
      u[idx].commentInput = "";
      setTasks(u);
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
      t.projects?.map(normalizeProject).includes(normalizeProject(categoryName)) &&
      !t.completed &&
      !t.inboxOnly
  );

  const priorityOptions = [
    { label: "🔴 Priority 1", command: () => setPriority({ level: 1, label: "🔴 Priority 1" }) },
    { label: "🟠 Priority 2", command: () => setPriority({ level: 2, label: "🟠 Priority 2" }) },
    { label: "🟡 Priority 3", command: () => setPriority({ level: 3, label: "🟡 Priority 3" }) },
    { label: "⚪ Priority 4", command: () => setPriority({ level: 4, label: "⚪ Priority 4" }) },
  ];

  const reminderOptions = [
    { label: "Set Date & Time", command: () => setReminder("datetime") },
    { label: "10 minutes before", command: () => setReminder("before") },
    { label: "Clear Reminder", command: () => { setReminder(null); setReminderTime(null); } },
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
                <span className="task-title" onClick={() => {
                    if (t.description) {
                      setCurrentDescription(t.description);
                      setDescOverlayVisible(true);
                    }
                  }}>
                  {t.title}
                  <div className="task-meta">
                    {new Date(t.date).toLocaleDateString()} • {t.projects?.join(", ")} • {t.priority.label}
                    {t.reminder && <> • ⏰ {t.reminder === "10 minutes before" ? t.reminder : new Date(t.reminder).toLocaleString()}</>}
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
                      setReminder(t.reminder === "10 minutes before" ? "before" : t.reminder ? "datetime" : null);
                      setReminderTime(t.reminder && t.reminder !== "10 minutes before" ? new Date(t.reminder) : null);
                      setProjects(t.projects);
                      setIsEditing(true);
                      setEditTaskIndex(globalIdx);
                      setShowForm(true);
                    }}
                  />
                  <i
                    className="pi pi-calendar"
                    title="Change Date"
                    onClick={() => toggleTaskProperty(globalIdx, "showDateEditor")}
                  />
                  <i
                    className="pi pi-comment"
                    title="Toggle Comments"
                    onClick={() => toggleTaskProperty(globalIdx, "showComments")}
                  />
                </div>
              </div>

              {t.showDateEditor && (
                <div style={{ marginLeft: "2rem", marginTop: "0.5rem" }}>
                  <Calendar
                    value={new Date(t.date)}
                    onChange={(e) => updateTaskDate(globalIdx, e.value)}
                    showIcon
                  />
                </div>
              )}

              {t.showComments && (
                <div style={{ marginLeft: "2rem", marginTop: "0.5rem", width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <InputText
                      placeholder="Add a comment and press Enter"
                      value={t.commentInput || ""}
                      onChange={(e) => handleCommentInputChange(globalIdx, e.target.value)}
                      onKeyDown={(e) => handleCommentEnter(e, globalIdx)}
                      style={{ width: "100%" }}
                    />
                    <Button
                      icon="pi pi-arrow-right"
                      className="p-button-text p-button-sm"
                      style={{ marginLeft: "0.5rem" }}
                      onClick={() => handleAddComment(globalIdx)}
                      disabled={!t.commentInput?.trim()}
                    />
                  </div>
                  <ul style={{ paddingLeft: "1rem", fontSize: "14px", marginTop: "0.5rem" }}>
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
        <Button label="Add task" icon="pi pi-plus" onClick={() => setShowForm(true)} className="p-button-danger" />
      ) : (
        <div className="task-form">
          <InputText value={task} onChange={(e) => setTask(e.target.value)} placeholder="e.g. Plan meeting #Work" className="task-input" />
          <InputTextarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={2} autoResize className="task-description-input" />
          <div className="task-tags">
            {!showCalendar ? (
              <Chip label={dueDate.toLocaleDateString()} removable onRemove={() => setShowCalendar(true)} icon="pi pi-calendar" />
            ) : (
              <Calendar value={dueDate} onChange={(e) => { setDueDate(e.value); setShowCalendar(false);} } showIcon />
            )}
            <Menu model={priorityOptions} popup ref={menu}/>
            <Chip label={priority.label} onClick={(e)=>menu.current.toggle(e)} className="priority-chip" />
            <Menu model={reminderOptions} popup ref={reminderMenu}/>
            <Chip label="Reminders" icon="pi pi-bell" onClick={(e)=> reminderMenu.current.toggle(e)} />
            {reminder==="datetime" && <Calendar showTime value={reminderTime} onChange={(e)=>setReminderTime(e.value)} placeholder="Select reminder time"/>}
          </div>
          <div className="task-footer">
            <Chip label={`#${categoryName}`} icon="pi pi-folder" />
            <div className="form-buttons">
              <Button label="Cancel" className="p-button-text" onClick={resetForm} />
              <Button label={isEditing ? "Update Task" : "Add Task"} className="p-button-danger" onClick={handleAddClick} />
            </div>
          </div>
        </div>
      )}

      <DescriptionOverlay visible={descOverlayVisible} description={currentDescription} onClose={()=>setDescOverlayVisible(false)} />
    </div>
  );
};

export default CategoryPage;
