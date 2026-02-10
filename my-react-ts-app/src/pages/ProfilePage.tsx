import React from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { deleteUser, signOut } from "firebase/auth";
import "../style/LoginPage.css";

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/logg-inn");
    } catch {
      alert("Noe gikk galt ved logout");
    }
  };

  const handleDeleteProfile = async () => {
    const confirmed = window.confirm(
      "Er du sikker pa at du vil slette profilen din? Dette kan ikke angres."
    );

    if (!confirmed) {
      return;
    }

    const user = auth.currentUser;

    if (!user) {
      alert("Fant ingen innlogget bruker.");
      return;
    }

    try {
      await deleteUser(user);
      await signOut(auth);
      navigate("/logg-inn");
    } catch {
      alert("Noe gikk galt ved sletting av profilen");
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

        <button
          className="login-button"
          style={{
            backgroundColor: "#b71c1c",
            color: "white",
            fontSize: "18px",
            fontWeight: 700,
            marginTop: "12px",
          }}
          onClick={handleDeleteProfile}
        >
          Slett profil
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
