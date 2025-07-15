// Components/SearchOverlay.jsx
import React from "react";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import "./SearchOverlay.css";

const SearchOverlay = ({ visible, onClose, tasks }) => {
  const [searchText, setSearchText] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState(null);

  const filteredTasks = tasks.filter((t) => {
    const matchText =
      t.title.toLowerCase().includes(searchText.toLowerCase()) ||
      t.project.toLowerCase().includes(searchText.toLowerCase());
    const matchDate = selectedDate
      ? new Date(t.date).toLocaleDateString() === selectedDate.toLocaleDateString()
      : true;
    return matchText && matchDate;
  });

  if (!visible) return null;

  return (
    <div className="search-overlay">
      <div className="search-panel">
        <div className="search-header">
          <h3>Search Tasks</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <InputText
          placeholder="Search by title or #project"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="search-input"
        />

        <Calendar
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.value)}
          placeholder="Search by date"
          showIcon
          className="calendar-search"
        />

        <ul className="search-results">
          {filteredTasks.map((t) => (
            <li key={t.id}>
              <strong>{t.title}</strong> – #{t.project} – {t.date}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SearchOverlay;
