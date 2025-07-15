import React, { useState, useEffect } from "react";
import AddTask from "./Components/AddTask";
import Sidebar from "./Components/Sidebar";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { Calendar } from "primereact/calendar";
import LabelsFeaturesSection from "./Components/LabelsFeaturesSection";
import "./App.css";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Add Task");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [inboxInput, setInboxInput] = useState("");
  const [inboxTime, setInboxTime] = useState(null);

  // 📌 Date checks
  const isToday = (isoDateStr) => {
    const date = new Date(isoDateStr);
    const today = new Date();
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  };

  const isFutureDate = (isoDateStr) => {
    const taskDate = new Date(isoDateStr);
    const today = new Date();
    taskDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return taskDate > today;
  };

  // 📂 Filter tasks by tab
  const todayTasks = tasks.filter(
    (t) => t.date && isToday(t.date) && !t.completed
  );
  const upcomingTasks = tasks.filter(
    (t) => t.date && isFutureDate(t.date) && !t.completed
  );
  const inboxTasks = tasks.filter(
    (t) =>
      (!t.date || t.project === "Inbox") &&
      !isToday(t.date) &&
      !isFutureDate(t.date) &&
      !t.completed
  );
  const completedTasks = tasks.filter((t) => t.completed);

  const filteredTasks = tasks.filter((t) => {
    const lower = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(lower) ||
      t.project.toLowerCase().includes(lower) ||
      (t.date && t.date.toLowerCase().includes(lower))
    );
  });

  // ✅ Handle inbox message send
  const handleSendInboxMessage = () => {
    if (!inboxInput.trim() || !inboxTime) return;

    const newTask = {
      id: Date.now(),
      title: inboxInput.trim(),
      description: "",
      project: "Inbox",
      date: inboxTime.toISOString(),
      reminder: inboxTime.toISOString(),
      priority: { level: 4, label: "⚪ Priority 4" },
      notified: false,
      completed: false,
    };

    setTasks((prev) => [...prev, newTask]);
    setInboxInput("");
    setInboxTime(null);
  };

  const handleCheckboxChange = (id) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // 🔔 Notification logic
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
            new Notification("📬 Reminder", {
              body: task.title,
            });
          }

          setTasks((prev) =>
            prev.map((t) => (t.id === task.id ? { ...t, notified: true } : t))
          );
        }
      });
    }, 30000); // every 30s

    return () => clearInterval(interval);
  }, [tasks]);

  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="app-layout" style={{ display: "flex", height: "100vh" }}>
      <Sidebar
        tasks={tasks}
        onOpenSearch={() => setSearchVisible(true)}
        onToggleNotifications={() => setNotificationsOpen((prev) => !prev)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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
        <div
          className="top-bar"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <Button
            label="Connect calendar"
            icon="pi pi-calendar-plus"
            className="p-button-outlined p-button-secondary"
          />
          <Button
            label="List"
            icon="pi pi-bars"
            className="p-button-text p-button-secondary"
          />
        </div>

        {activeTab === "Add Task" && (
          <AddTask tasks={tasks} setTasks={setTasks} />
        )}

        {activeTab === "Today" && (
          <div>
            <h3 style={{ marginLeft: "4rem" }}>Today's Tasks</h3>
            {todayTasks.length > 0 ? (
              todayTasks.map((t) => (
                <div
                  key={t.id}
                  style={{ marginBottom: "1rem", marginLeft: "4rem" }}
                >
                  <Checkbox
                    onChange={() => handleCheckboxChange(t.id)}
                    checked={t.completed}
                  />
                  <strong style={{ marginLeft: "0.5rem" }}>{t.title}</strong>
                  <p style={{ fontSize: "0.9rem", color: "#666" }}>
                    #{t.project} • {t.date} • {t.priority?.label}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ marginLeft: "4rem" }}>No tasks for today.</p>
            )}
          </div>
        )}

        {activeTab === "Inbox" && (
          <div style={{ padding: "2rem" }}>
            <h3>Inbox</h3>

            <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
              <InputText
                value={inboxInput}
                onChange={(e) => setInboxInput(e.target.value)}
                placeholder="Send a message to yourself..."
                style={{ flex: 2 }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendInboxMessage();
                }}
              />

              <Calendar
                value={inboxTime}
                onChange={(e) => setInboxTime(e.value)}
                placeholder="Pick time"
                showTime
                style={{ flex: 1 }}
              />

              <Button
                label="Send"
                icon="pi pi-send"
                severity="secondary" 
                onClick={handleSendInboxMessage}
                disabled={!inboxInput.trim() || !inboxTime}
              />
            </div>

            {inboxTasks.length > 0 ? (
              inboxTasks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#dcf8c6",
                      borderRadius: "1rem",
                      padding: "0.75rem 1rem",
                      maxWidth: "60%",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div style={{ fontWeight: "bold" }}>{t.title}</div>
                    <div style={{ fontSize: "0.85rem", color: "#555" }}>
                      {new Date(t.date).toLocaleString()} • #{t.project}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p></p>
            )}
          </div>
        )}

        {activeTab === "Upcoming" && (
          <div>
            <h3 style={{ marginLeft: "4rem" }}>Upcoming Tasks</h3>
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((t) => (
                <div
                  key={t.id}
                  style={{ marginBottom: "1rem", marginLeft: "4rem" }}
                >
                  <Checkbox
                    onChange={() => handleCheckboxChange(t.id)}
                    checked={t.completed}
                  />
                  <strong style={{ marginLeft: "0.5rem" }}>{t.title}</strong>
                  <p style={{ fontSize: "0.9rem", color: "#666" }}>
                    #{t.project} • {t.date} • {t.priority?.label}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ marginLeft: "4rem" }}>No upcoming tasks.</p>
            )}
          </div>
        )}

        {activeTab === "Completed" && (
          <div>
            <h3 style={{ marginLeft: "4rem" }}>Completed Tasks</h3>
            {completedTasks.length > 0 ? (
              completedTasks.map((t) => (
                <div
                  key={t.id}
                  style={{ marginBottom: "1rem", marginLeft: "4rem" }}
                >
                  <Checkbox
                    onChange={() => handleCheckboxChange(t.id)}
                    checked={t.completed}
                  />
                  <strong
                    style={{
                      textDecoration: "line-through",
                      marginLeft: "0.5rem",
                    }}
                  >
                    {t.title}
                  </strong>
                  <p style={{ fontSize: "0.9rem", color: "#666" }}>
                    #{t.project} • {t.date} • {t.priority?.label}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ marginLeft: "4rem" }}>No completed tasks.</p>
            )}
          </div>
        )}

        {activeTab === "Filters & Labels" && (
          <div style={{ padding: "2rem" }}>
            <LabelsFeaturesSection />
          </div>
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

      <Dialog
        header="Search Tasks"
        visible={searchVisible}
        style={{ width: "40vw" }}
        onHide={() => {
          setSearchVisible(false);
          setSearchQuery("");
        }}
        draggable={false}
        modal
      >
        <InputText
          placeholder="Search by title, #project or date"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-inputtext-lg"
          style={{ width: "100%", marginBottom: "1rem" }}
        />

        {searchQuery && (
          <div>
            {filteredTasks.length > 0 ? (
              filteredTasks.map((t) => (
                <div key={t.id} style={{ marginBottom: "1rem" }}>
                  <strong>{t.title}</strong>
                  <p style={{ fontSize: "0.9rem", color: "#666" }}>
                    #{t.project} • {t.date} • {t.priority?.label}
                  </p>
                </div>
              ))
            ) : (
              <p>No matching tasks found.</p>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
