import React from "react";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";

const SideNavBar = () => {
  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogout = () => {
    signOut(auth).then(() => {
      navigate("/login");
    });
  };

  return (
    <div className="side-nav">
      <Button label="Home" icon="pi pi-home" onClick={() => navigate("/")} className="nav-btn" />
      <Button label="Add New Song" icon="pi pi-plus" onClick={() => navigate("/add")} className="nav-btn" />
      <Button label="History" icon="pi pi-calendar" onClick={() => navigate("/history")} className="nav-btn" />
      <Button label="Logout" icon="pi pi-sign-out" onClick={handleLogout} className="p-button-danger nav-btn" />
    </div>
  );
};

export default SideNavBar;