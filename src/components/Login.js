// src/components/Login.js
import React, { useState } from "react";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import "./Login.css";

const Login = () => {
  const { t } = useTranslation();
  const auth = getAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (error) {
      alert("Google login failed: " + error.message);
    }
  };

  return (
    <div className="login-container">
      <Card title={t("auth.login")} className="login-card">
        <Button label="Login with Google" icon="pi pi-google" className="p-button-warning login-btn" onClick={handleGoogleLogin} />
      </Card>
    </div>
  );
};

export default Login;
