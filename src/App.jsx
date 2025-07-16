import React, { useState, useEffect } from "react";
import AddTask from "./Components/AddTask";
import Sidebar from "./Components/Sidebar";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import LabelsFeaturesSection from "./Components/LabelsFeaturesSection";
import "./App.css";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDate, setSearchDate] = useState(null);
  const [activeTab, setActiveTab] = useState("Add Task");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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

  const todayTasks = tasks.filter(
    (t) => t.date && isToday(t.date) && !t.completed
  );
  const upcomingTasks = tasks.filter(
    (t) => t.date && isFutureDate(t.date) && !t.completed
  );
  const inboxTasks = tasks
    .filter((t) => t.project === "#Inbox" && !t.completed)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const completedTasks = tasks.filter((t) => t.completed);

  const filteredTasks = tasks.filter((t) => {
    const lower = searchQuery.toLowerCase();
    const matchText =
      t.title.toLowerCase().includes(lower) ||
      t.project.toLowerCase().includes(lower) ||
      (t.date && t.date.toLowerCase().includes(lower));

    const matchDate = searchDate
      ? new Date(t.date).toDateString() === searchDate.toDateString()
      : true;

    return matchText && matchDate;
  });

  const handleCompleteTask = (id) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

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
        todayCount={todayTasks.length}
        upcomingCount={upcomingTasks.length}
        completedCount={completedTasks.length}
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
          <AddTask
            tasks={tasks.filter((t) => !t.completed)}
            setTasks={setTasks}
            handleCompleteTask={handleCompleteTask}
          />
        )}

        {activeTab === "Today" && (
          <div>
            <h3 style={{ marginLeft: "4rem" }}>Today's Tasks</h3>
            {todayTasks.length > 0 ? (
              todayTasks.map((t) => (
                <div
                  key={t.id}
                  style={{ marginLeft: "4rem", marginBottom: "1rem" }}
                >
                  <input
                    type="checkbox"
                    onChange={() => handleCompleteTask(t.id)}
                    checked={t.completed}
                    style={{ marginRight: "0.5rem" }}
                  />
                  <strong>{t.title}</strong>
                  <p style={{ fontSize: "0.9rem", color: "#666" }}>
                    {t.project} • {t.date} • {t.priority?.label}
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
            {inboxTasks.length > 0 ? (
              inboxTasks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      padding: "0.75rem 1.5rem",
                      maxWidth: "100%",
                    }}
                  >
                    <div style={{ fontWeight: "bold" }}>{t.title}</div>
                    <div style={{ fontSize: "0.85rem", color: "#555" }}>
                      {new Date(t.date).toLocaleString()} • {t.project}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No tasks in inbox.</p>
            )}
          </div>
        )}

        {activeTab === "Upcoming" && (
          <div>
            <h3 style={{ marginLeft: "4rem" }}>Upcoming Tasks</h3>
            {upcomingTasks.map((t) => (
              <div
                key={t.id}
                style={{ marginLeft: "4rem", marginBottom: "1rem" }}
              >
                <input
                  type="checkbox"
                  onChange={() => handleCompleteTask(t.id)}
                  checked={t.completed}
                  style={{ marginRight: "0.5rem" }}
                />
                <strong>{t.title}</strong>
                <p style={{ fontSize: "0.9rem", color: "#666" }}>
                  {t.project} • {t.date} • {t.priority?.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Completed" && (
          <div>
            <h3 style={{ marginLeft: "4rem" }}>Completed Tasks</h3>
            {completedTasks.map((t) => (
              <div
                key={t.id}
                style={{ marginLeft: "4rem", marginBottom: "1rem" }}
              >
                <input
                  type="checkbox"
                  onChange={() => handleCompleteTask(t.id)}
                  checked={t.completed}
                  style={{ marginRight: "0.5rem" }}
                />
                <strong style={{ textDecoration: "line-through" }}>
                  {t.title}
                </strong>
                <p style={{ fontSize: "0.9rem", color: "#666" }}>
                  {t.project} • {t.date} • {t.priority?.label}
                </p>
              </div>
            ))}
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

      {/* 🔍 Search Dialog */}
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
                <div key={t.id} style={{ marginBottom: "1rem" }}>
                  <strong>{t.title}</strong>
                  <p style={{ fontSize: "0.9rem", color: "#666" }}>
                    {t.project} • {t.date} • {t.priority?.label}
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
