// src/components/AdminPanel.js
import React, { useState } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../services/firebaseConfig";
import "./AdminPanel.css";

const AdminPanel = () => {
  const [uid, setUid] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  const roles = [
    { label: "Admin", value: "admin" },
    { label: "User", value: "user" }
  ];

  const handleAssignRole = async () => {
    if (!uid || !role) {
      setStatus("Please fill both fields.");
      return;
    }

    try {
      await setDoc(doc(db, "roles", uid), { role });
      setStatus(`Role '${role}' assigned to UID: ${uid}`);
      setUid("");
      setRole("");
    } catch (err) {
      setStatus("Error assigning role: " + err.message);
    }
  };

  return (
    <div className="admin-panel-container">
      <Card title="Admin Role Manager" className="admin-card">
        <div className="form-group">
          <label>User UID</label>
          <InputText value={uid} onChange={(e) => setUid(e.target.value)} className="p-inputtext-sm" />
        </div>
        <div className="form-group">
          <label>Select Role</label>
          <Dropdown value={role} options={roles} onChange={(e) => setRole(e.value)} placeholder="Select Role" />
        </div>
        <Button label="Assign Role" icon="pi pi-check" onClick={handleAssignRole} className="p-button-success" />
        {status && <p className="status-msg">{status}</p>}
      </Card>
    </div>
  );
};

export default AdminPanel;
