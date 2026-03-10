import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; 
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import "../style/LoginPage.css";
import Layout from "../components/Layout";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/profil"); 
    } catch {
      alert("Feil brukernavn eller passord");
    }
  };

  return (
    <Layout>
    <div className="login-wrapper">
      <div className="login-card">
        <h2 className="login-title">Logg inn</h2>

        <input
          type="email" 
          placeholder="E-post"
          className="login-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Passord"
          className="login-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button 
        className="login-button primary"
        onClick={handleLogin} 
        >
          Logg inn
        </button>

        <button 
        className="login-button secondary"
        onClick={() => navigate("/")}
        >
          Fortsett som gjest
        </button>

        <div className="login-register">
          <span>Har du ikke bruker?</span>
          <Link to="/registrer">Registrer deg</Link>
        </div>
      </div>
    </div>
  </Layout>
  );
};

export default LoginPage;
