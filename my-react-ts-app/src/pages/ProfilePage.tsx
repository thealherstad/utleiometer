import React from "react";
import { useNavigate } from "react-router-dom";
import { auth, } from "../firebase";
import { signOut } from "firebase/auth";
import "../style/LoginPage.css"; // vi gjenbruker LoginPage-stilen

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/logg-inn"); // tilbake til login
    } catch (error) {
      alert("Noe gikk galt ved logout");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2 className="login-title">Profil</h2>

        <p style={{ marginBottom: "30px" }}>
          Du er logget inn som: <strong>{auth.currentUser?.email}</strong>
        </p>

        <button
          className="login-button"
          style={{
            backgroundColor: "#e53935",
            color: "white",
            fontSize: "18px",
            fontWeight: 700,
          }}
          onClick={handleLogout}
        >
          Logg ut
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
