import React, { useState } from 'react';
import "../style/Registrationpage.css"; 
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const RegistrationPage: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            console.log("Bruker registrert:", userCredential.user);
            console.log("Brukernavn (ikke lagret enda):", username);

        } catch (err: any) {
            console.error("Registrering feilet:", err);
            setError(err.message);
        }
    };

    return (
        <div className ="page-center">
            <div className="register-box">
            <h2>Registrer bruker</h2>

            <form onSubmit={handleSubmit}>
                <div>
                    <label>
                        E-post:
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </label>
                </div>

                <div>
                    <label>
                        Brukernavn:
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </label>
                </div>

                <div>
                    <label>
                        Passord:
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </label>
                </div>

                <button type="submit">Registrer</button>

                {error && <p className='error'>{error}</p>}
            </form>
        </div>
    </div>
    );

}; 

export default RegistrationPage;
