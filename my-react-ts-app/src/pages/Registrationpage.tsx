import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "../style/Registrationpage.css";
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import Layout from '../components/Layout';

const RegistrationPage: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            await updateProfile(userCredential.user, {
                displayName: username,
            });

            await setDoc(doc(db, "users", userCredential.user.uid), {
             displayName: username,
             email: email,
              createdAt: new Date(),
            });

            navigate('/profil');

        } catch (err: unknown) {
            console.error("Registrering feilet:", err);
            const message = err instanceof Error ? err.message : "Noe gikk galt under registrering";
            setError(message);
        }
    };

    return (
        <Layout>
        <div className="register-wrapper">
            <div className="register-card">
            <h2 className="register-title">Registrer bruker</h2>

            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="E-post"
                    className="register-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    type="text"
                    placeholder="Brukernavn"
                    className="register-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Passord"
                    className="register-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button className="register-button primary" type="submit">Registrer</button>
                <button
                    className="register-button secondary"
                    type="button"
                    onClick={() => navigate('/logg-inn')}
                >
                    Tilbake til innlogging
                </button>

                {error && <p className="error">{error}</p>}

                <div className="register-login">
                    <span>Har du allerede bruker?</span>
                    <Link to="/logg-inn">Logg inn</Link>
                </div>
            </form>
        </div>
    </div>
    </Layout>
    );

}; 

export default RegistrationPage;
