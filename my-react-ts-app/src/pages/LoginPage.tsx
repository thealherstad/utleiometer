import React from "react";
import "../style/LoginPage.css";

const LoginPage: React.FC = () => {
  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2 className="login-title">Logg inn</h2>

        <input
          type="text"
          placeholder="Brukernavn"
          className="login-input"
        />

        <input
          type="password"
          placeholder="Passord"
          className="login-input"
        />

        <button className="login-button primary">
          Logg inn
        </button>

        <button className="login-button secondary">
          Fortsett som gjest
        </button>

        <button className="login-button secondary">
          Registrer deg
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
