import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Song from "./components/Song";
import SideNavBar from "./components/SideNavBar";
import EventEditor from "./components/EventEditor";
import EventHistory from "./components/EventHistory";
import Login from "./components/Login";
import Register from "./components/Register";
import PrivateRoute from "./components/PrivateRoute";
import "./App.css";

const AppLayout = () => {
  return (
    <div className="app-layout">
      <SideNavBar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<Song />} />
          <Route path="/song/:id" element={<Song />} />
          <Route path="/event/new" element={<EventEditor />} />
          <Route path="/event/:id" element={<EventEditor />} />
          <Route path="/history" element={<EventHistory />} />
        </Routes>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/*" element={<PrivateRoute><AppLayout /></PrivateRoute>} />
      </Routes>
    </Router>
  );
};

export default App;