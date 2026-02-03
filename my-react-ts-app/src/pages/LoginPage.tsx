import React from "react";

const LoginPage: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        backgroundColor: "#e0e3e8", // litt lysere bakgrunn for kontrast
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "45px 30px",
          borderRadius: "14px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)", // sterkere kontrast
          maxWidth: "420px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            marginBottom: "30px",
            color: "#222",
            fontSize: "32px",       // større font
            fontWeight: "800",
            textShadow: "2px 2px 4px rgba(0,0,0,0.25)", // tydelig skygge
          }}
        >
          Logg inn
        </h2>

        <input
          type="text"
          placeholder="Brukernavn"
          style={{
            width: "100%",
            padding: "14px",
            marginBottom: "18px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            fontSize: "16px",
            boxSizing: "border-box",  // sikrer lik margin på begge sider
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#4CAF50";
            e.currentTarget.style.boxShadow = "0 0 6px rgba(76,175,80,0.5)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#ccc";
            e.currentTarget.style.boxShadow = "none";
          }}
        />

        <input
          type="password"
          placeholder="Passord"
          style={{
            width: "100%",
            padding: "14px",
            marginBottom: "25px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            fontSize: "16px",
            boxSizing: "border-box",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#4CAF50";
            e.currentTarget.style.boxShadow = "0 0 6px rgba(76,175,80,0.5)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#ccc";
            e.currentTarget.style.boxShadow = "none";
          }}
        />

        {/* Logg inn knapp */}
        <button
          style={{
            width: "100%",
            padding: "14px",
            marginBottom: "14px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "18px",
            fontWeight: "700",
            cursor: "pointer",
            transition: "background-color 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#45a049";
            e.currentTarget.style.boxShadow = "0 5px 12px rgba(0,0,0,0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#4CAF50";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Logg inn
        </button>

        {/* Fortsett som gjest */}
        <button
          style={{
            width: "100%",
            padding: "14px",
            marginBottom: "14px",
            backgroundColor: "#888",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
            cursor: "pointer",
            transition: "background-color 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#666";
            e.currentTarget.style.boxShadow = "0 5px 12px rgba(0,0,0,0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#888";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Fortsett som gjest
        </button>

        {/* Registrer deg */}
        <button
          style={{
            width: "100%",
            padding: "14px",
            backgroundColor: "#888",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
            cursor: "pointer",
            transition: "background-color 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#666";
            e.currentTarget.style.boxShadow = "0 5px 12px rgba(0,0,0,0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#888";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Registrer deg
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
