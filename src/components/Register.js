// src/components/Register.js
import React from "react";
import { GoogleAuthProvider, signInWithPopup, getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "primereact/card";
import { Button } from "primereact/button";

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const auth = getAuth();
  const provider = new GoogleAuthProvider();

  const handleGoogleRegister = async () => {
    try {
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (error) {
      alert("Google registration failed: " + error.message);
    }
  };

  return (
    <div className="login-container">
      <Card title={t("auth.register")} className="login-card">
        <Button
          label="Sign Up with Google"
          icon="pi pi-google"
          className="p-button-warning login-btn"
          onClick={handleGoogleRegister}
        />
        <Button
          label={t("auth.login")}
          className="p-button-secondary login-btn"
          onClick={() => navigate("/login")}
        />
      </Card>
    </div>
  );
};

export default Register;
