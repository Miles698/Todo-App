import React from "react";
import AddTask from "./Components/AddTask";
import { Button } from "primereact/button";
import "./App.css";

export default function App() {
  return (
    <div className="app-container">
      <div className="main-content">
        <div className="top-bar">
          <Button label="Connect calendar" icon="pi pi-calendar-plus" className="p-button-outlined p-button-secondary" />
          <Button label="List" icon="pi pi-bars" className="p-button-text p-button-secondary" />
        </div>
        <AddTask />
      </div>
    </div>
  );
}
