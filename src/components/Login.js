// src/components/Login.js
import React, { useState } from "react";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const auth = getAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  };

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
      <Card title="Band App Login" className="login-card">
        <Button label="Login with Google" icon="pi pi-google" className="p-button-warning login-btn" onClick={handleGoogleLogin} />
        <Button label="Register" className="p-button-secondary login-btn" onClick={() => navigate("/register")} />
      </Card>
    </div>
  );
};

export default Login;
