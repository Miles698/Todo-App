// App.jsx
import React, { useState, useEffect } from "react";
import AddTask from "./Components/AddTask";
import Sidebar from "./Components/Sidebar";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import LabelsFeaturesSection from "./Components/LabelsFeaturesSection";
import CategoryPage from "./Components/CategoryPage";
import "./App.css";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDate, setSearchDate] = useState(null);
  const [activeTab, setActiveTab] = useState("Add Task");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [customCategories, setCustomCategories] = useState([]);
  const [recentlyCompleted, setRecentlyCompleted] = useState(null);
  const [showUndo, setShowUndo] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingText, setEditingText] = useState("");
  

  const today = new Date();
const isToday = (someDate) =>
  someDate.getDate() === today.getDate() &&
  someDate.getMonth() === today.getMonth() &&
  someDate.getFullYear() === today.getFullYear();

const todayTasks = tasks.filter((t) => {
  return (
    !t.completed &&
    !t.inboxOnly &&
    t.date &&
    isToday(new Date(t.date)) // ✅ include tasks even with subcategories
  );
});


  const isFutureDate = (isoDateStr) => {
    const taskDate = new Date(isoDateStr);
    const today = new Date();
    taskDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return taskDate > today;
  };

  

  const upcomingTasks = tasks.filter(
    (task) =>
      !task.completed &&
      task.date &&
      isFutureDate(task.date) &&
      (!task.projects ||
        !task.projects.some((p) =>
          customCategories.includes(p.replace("#", ""))
        ))
  );

  const inboxTasks = tasks.filter(
    (task) =>
      task.inboxOnly &&
      !task.completed &&
      (!task.projects || task.projects.length === 0)
  );

  const completedTasks = tasks.filter((t) => t.completed);

  const filteredTasks = tasks.filter((t) => {
    const lower = searchQuery.toLowerCase();
    const matchText =
      t.title.toLowerCase().includes(lower) ||
      (t.projects && t.projects.some((p) => p.toLowerCase().includes(lower))) ||
      (t.date && t.date.toLowerCase().includes(lower));

    const matchDate = searchDate
      ? new Date(t.date).toDateString() === searchDate.toDateString()
      : true;

    return matchText && matchDate;
  });

  const handleAddTask = async (newTask) => {
    const taskToAdd = {
      ...newTask,
      completed: false,
      inboxOnly: activeTab === "Inbox",
      createdAt: serverTimestamp(),
    };

    if (!taskToAdd.projects || taskToAdd.projects.length === 0) {
      taskToAdd.projects = customCategories.includes(activeTab)
        ? [`#${activeTab}`]
        : ["#Inbox"];
    }

    try {
      await addDoc(collection(db, "tasks"), taskToAdd);
    } catch (err) {
      console.error("Error adding task to Firestore:", err);
    }
  };

  const handleEditTask = async (id, updates) => {
    try {
      const taskRef = doc(db, "tasks", id);
      await updateDoc(taskRef, updates);
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
    } catch (err) {
      console.error("Error editing task:", err);
    }
  };

  const handleEdit = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    setEditingTaskId(taskId);
    setEditingText(task?.title || "");
  };

  const handleSaveEdit = async (taskId, newText) => {
    await handleEditTask(taskId, { title: newText });
    setEditingTaskId(null);
  };

  const handleCompleteTask = async (id) => {
  const taskRef = doc(db, "tasks", id); // ✅ Fix: define the document reference properly

  await updateDoc(taskRef, { completed: true });

  // ✅ Optimistically update UI
  setTasks((prev) =>
    prev.map((task) => (task.id === id ? { ...task, completed: true } : task))
  );

  const justCompleted = tasks.find((task) => task.id === id);
  if (justCompleted && !justCompleted.completed) {
    setRecentlyCompleted(justCompleted);
    setShowUndo(true);

    // Hide Undo after 5 seconds
    setTimeout(() => {
      setShowUndo(false);
      setRecentlyCompleted(null);
    }, 5000);
  }
};

  const handleUndo = async () => {
    if (recentlyCompleted) {
      try {
        const taskRef = doc(db, "tasks", recentlyCompleted.id);
        await updateDoc(taskRef, { completed: false });
      } catch (err) {
        console.error("Undo error:", err);
      }
      setShowUndo(false);
      setRecentlyCompleted(null);
    }
  };

  const toggleTaskProperty = (taskId, property) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, [property]: !t[property] } : t
      )
    );
  };
  const handleAddComment = async (index) => {
    const task = tasks[index];
    const newComment = task.commentInput?.trim();
    if (!newComment) return;

    const updatedComments = [...(task.comments || []), newComment];

    await handleEditTask(task.id, {
      comments: updatedComments,
      commentInput: "",
    });

    setTasks((prevTasks) => {
      const updated = [...prevTasks];
      updated[index] = {
        ...task,
        comments: updatedComments,
        commentInput: "",
      };
      return updated;
    });
  };

  const allProjects = Array.from(
  new Set(tasks.flatMap((t) => t.projects || []))
);

  const handleCommentEnter = (e, index) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddComment(index);
    }
  };
  const categorizedProjects = {};

tasks.forEach((task) => {
  (task.projects || []).forEach((p) => {
    const normalized = p.trim().replace(/^#+/, ""); // remove extra #
    const [main, sub] = normalized.split("/");

    const mainCategory = `#${main}`;
    const subCategory = sub?.trim() || null;

    if (!categorizedProjects[mainCategory]) {
      categorizedProjects[mainCategory] = new Set();
    }

    if (subCategory) {
      categorizedProjects[mainCategory].add(subCategory);
    }
  });
});

// Convert Sets to Array
const finalCategories = Object.fromEntries(
  Object.entries(categorizedProjects).map(([k, v]) => [k, Array.from(v)])
);


  const handleDateChange = async (taskId, newDate) => {
    const isoDate = newDate.toISOString().split("T")[0]; // convert to YYYY-MM-DD

    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, { date: isoDate });

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, date: isoDate, showDateEditor: false } : t
        )
      );
    } catch (err) {
      console.error("Error updating task date:", err);
    }
  };

  // 🛎️ Reminder Notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      tasks.forEach((task) => {
        if (
          task.reminder &&
          typeof task.reminder === "string" &&
          !task.notified &&
          new Date(task.reminder).getTime() <= now.getTime()
        ) {
          if (Notification.permission === "granted") {
            new Notification("📬 Reminder", { body: task.title });
          }
          setTasks((prev) =>
            prev.map((t) => (t.id === task.id ? { ...t, notified: true } : t))
          );
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [tasks]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "tasks"), (snapshot) => {
      const firebaseTasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(firebaseTasks);
    });

    return () => unsub();
  }, []);

  return (
    <div className="app-layout" style={{ display: "flex", height: "100vh" }}>
      <Sidebar
        tasks={tasks}
        onOpenSearch={() => setSearchVisible(true)}
        onToggleNotifications={() => setNotificationsOpen((prev) => !prev)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        todayCount={todayTasks.length}
        upcomingCount={upcomingTasks.length}
        completedCount={completedTasks.length}
        customCategories={customCategories}
        setCustomCategories={setCustomCategories}
        onCategoryClick={(cat) => setActiveTab(cat)}
      />

      <div
        className="main-content"
        style={{
          flex: 1,
          padding: "1rem",
          overflowY: "auto",
          marginRight: notificationsOpen ? "300px" : 0,
        }}
      >
        
        {activeTab === "Add Task" && (
          <AddTask
            tasks={tasks.filter(
              (t) =>
                !t.completed &&
                (!t.projects ||
                  !customCategories.includes(t.projects[0]?.replace("#", "")))
            )}
            setTasks={setTasks}
            handleCompleteTask={handleCompleteTask}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            allProjects={Array.from(
    new Set(tasks.flatMap((task) => task.projects || []))
  )}
            
          />
        )}

        {activeTab === "Today" && (
          <div>
            <h3 style={{ marginLeft: "2.5rem" }}>Today's Tasks</h3>
            {todayTasks.length > 0 ? (
              todayTasks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    marginLeft: "2.5rem",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={() => handleCompleteTask(t.id)}
                    style={{ marginRight: "0.5rem" }}
                  />
                  <strong>{t.title}</strong>
                  <p style={{ fontSize: "0.9rem", color: "#666" }}>
                    {t.projects?.join(", ")} • {t.date}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ marginLeft: "2.5rem" }}>No tasks for today.</p>
            )}
          </div>
        )}

        {activeTab === "Inbox" && (
          <div style={{ padding: "1rem" }}>
            <h3>Inbox</h3>
            {tasks.filter((t) => {
              // Normalize project to #Inbox if missing or empty
              const normalized = t.projects?.length
                ? t.projects.map((p) =>
                    p.trim().startsWith("#") ? p : `#${p}`
                  )
                : ["#Inbox"];
              return normalized.includes("#Inbox") && !t.completed;
            }).length > 0 ? (
              tasks
                .filter((t) => {
                  const normalized = t.projects?.length
                    ? t.projects.map((p) =>
                        p.trim().startsWith("#") ? p : `#${p}`
                      )
                    : ["#Inbox"];
                  return normalized.includes("#Inbox") && !t.completed;
                })
                .map((t) => (
                  <div
                    key={t.id}
                    className="task-item-wrapper"
                    style={{
                      padding: "0.75rem",
                      marginBottom: "0.75rem",

                      position: "relative",
                      background: "#fff",
                    }}
                  >
                    <strong>{t.title}</strong>
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "#555",
                        marginTop: "0.25rem",
                      }}
                    >
                      {t.date || "No date"} •{" "}
                      {t.projects?.join(", ") || "#Inbox"}
                    </p>

                    {/* Hover icons like calendar/comment/edit */}
                    <div
                      className="hover-actions"
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "10px",
                      }}
                    >
                      <i
                        className="pi pi-calendar"
                        title="Change Date"
                        style={{ marginRight: "0.5rem", cursor: "pointer" }}
                        onClick={() =>
                          toggleTaskProperty(t.id, "showDateEditor")
                        }
                      />
                      <i
                        className="pi pi-comment"
                        title="Toggle Comments"
                        style={{ marginRight: "0.5rem", cursor: "pointer" }}
                        onClick={() => toggleTaskProperty(t.id, "showComments")}
                      />
                      <i
                        className="pi pi-pencil"
                        title="Edit Task"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleEdit(t.id)}
                      />
                    </div>

                    {/* Comment Input */}
                    {t.showComments && (
                      <div className="comment-box">
                        <InputText
                          value={t.commentInput || ""}
                          onChange={(e) =>
                            setTasks((prev) =>
                              prev.map((task) =>
                                task.id === t.id
                                  ? { ...task, commentInput: e.target.value }
                                  : task
                              )
                            )
                          }
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleAddComment(t.id)
                          }
                          placeholder="Write a comment and press Enter"
                          style={{ width: "100%", marginTop: "0.5rem" }}
                        />
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

                    {/* Optional: Date picker */}
                    {t.showDateEditor && (
                      <div style={{ marginTop: "0.5rem" }}>
                        <Calendar
                          value={t.date}
                          onChange={(e) => handleDateChange(t.id, e.value)}
                          showIcon
                        />
                      </div>
                    )}
                  </div>
                ))
            ) : (
              <p>No tasks in inbox.</p>
            )}
          </div>
        )}

        {activeTab === "Upcoming" && (
          <div>
            <h3 style={{ marginLeft: "2.5rem" }}>Upcoming Tasks</h3>
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    marginLeft: "2.5rem",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={() => handleCompleteTask(t.id)}
                    style={{ marginRight: "0.5rem" }}
                  />
                  <strong>{t.title}</strong>
                  <p style={{ fontSize: "0.9rem", color: "#666" }}>
                    {t.projects?.join(", ")} • {t.date}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ marginLeft: "2.5rem" }}>No upcoming tasks.</p>
            )}
          </div>
        )}

        {activeTab === "Completed" && (
          <div>
            <h3 style={{ marginLeft: "2.5rem" }}>Completed Tasks</h3>
            {completedTasks.map((t) => (
              <div
                key={t.id}
                style={{
                  marginLeft: "2.5rem",
                }}
              >
                <input
                  type="checkbox"
                  checked={t.completed}
                  onChange={() => handleCompleteTask(t.id)}
                  style={{ marginRight: "0.5rem" }}
                />
                <strong style={{ textDecoration: "line-through" }}>
                  {t.title}
                </strong>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Filters & Labels" && (
          <div style={{ padding: "2rem" }}>
            <LabelsFeaturesSection />
          </div>
        )}

        {customCategories.includes(activeTab) && (
          <CategoryPage
            categoryName={activeTab}
            tasks={tasks}
            setTasks={setTasks}
            handleCompleteTask={handleCompleteTask}
            handleEditTask={handleEditTask} // ✅ Required
            onAddTask={handleAddTask} // ✅ Required for new tasks
            defaultProject={activeTab}
          />
        )}
      </div>

      {notificationsOpen && (
        <div className="notification-panel">
          <h4>🔔 Notifications</h4>
          <ul>
            <li>You added a task</li>
            <li>You updated a due date</li>
          </ul>
        </div>
      )}

      {/* 🔁 UNDO Snackbar */}
      {showUndo && recentlyCompleted && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#333",
            color: "#fff",
            padding: "1rem 2rem",
            borderRadius: "8px",
            zIndex: 1000,
            boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
          }}
        >
          Task <strong>{recentlyCompleted.title}</strong> marked as completed.
          <button
            onClick={handleUndo}
            style={{
              marginLeft: "1rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#ff5252",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Undo
          </button>
        </div>
      )}

      <Dialog
        header="Search Tasks"
        visible={searchVisible}
        style={{ width: "40vw" }}
        onHide={() => {
          setSearchVisible(false);
          setSearchQuery("");
          setSearchDate(null);
        }}
        modal
      >
        <InputText
          placeholder="Search by title or #project"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: "100%", marginBottom: "1rem" }}
        />
        <Calendar
          value={searchDate}
          onChange={(e) => setSearchDate(e.value)}
          placeholder="Search by date"
          showIcon
          style={{ marginBottom: "1rem" }}
        />
        {searchQuery || searchDate ? (
          <div>
            {filteredTasks.length > 0 ? (
              filteredTasks.map((t) => (
                <div key={t.id}>
                  <strong>{t.title}</strong>
                  <p style={{ fontSize: "0.9rem", color: "#666" }}>
                    {t.projects?.join(", ")} • {t.date}
                  </p>
                </div>
              ))
            ) : (
              <p>No matching tasks found.</p>
            )}
          </div>
        ) : (
          <p>Type a query or select a date to search tasks.</p>
        )}
      </Dialog>
    </div>
  );
}
