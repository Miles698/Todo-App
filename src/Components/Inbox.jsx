// Components/Inbox.jsx
import React from "react";
import { Divider } from "primereact/divider";

export default function Inbox({ tasks, setTasks }) {
  const inboxTasks = tasks.filter((t) => t.project.toLowerCase() === "inbox");

  const handleRemoveTask = (index) => {
    const updated = [...tasks];
    const inboxIndex = tasks.findIndex((t) => t.id === inboxTasks[index].id);
    updated.splice(inboxIndex, 1);
    setTasks(updated);
  };

  return (
    <div className="inbox-wrapper">
      <h2>📥 Inbox</h2>
      {inboxTasks.length === 0 && <p>No tasks in Inbox.</p>}

      {inboxTasks.map((t, index) => (
        <div key={t.id} className="inbox-task">
          <div className="task-header">
            <input type="checkbox" onChange={() => handleRemoveTask(index)} />
            <div>
              <strong>{t.title}</strong>
              <div className="task-meta">
                {t.date} • {t.priority.label}
                {t.reminder && ` • ⏰ ${t.reminder}`}
              </div>
            </div>
          </div>

          {t.description && (
            <div className="task-desc">
              <em>{t.description}</em>
            </div>
          )}
          <Divider />
        </div>
      ))}
    </div>
  );
}
