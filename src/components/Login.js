// src/components/Login.js
import React from "react"; // Removed useState
import { GoogleAuthProvider, signInWithPopup, getAuth } from "firebase/auth"; // Removed signInWithEmailAndPassword
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import "./Login.css";

const Login = () => {
  // Removed email, password, and handleLogin as they were unused
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
      <Card title="Band App Login" className="login-card">
        <Button label="Login with Google" icon="pi pi-google" className="p-button-warning login-btn" onClick={handleGoogleLogin} />
        <Button label="Register" className="p-button-secondary login-btn" onClick={() => navigate("/register")} />
      </Card>
    </div>
  );
};

export default Login;