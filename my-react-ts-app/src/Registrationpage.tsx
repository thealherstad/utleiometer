import React, { useState } from 'react';
import "./Registrationpage.css"; 

const RegistrationPage: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        const registarationData = {
            email,
            username,
            password
        };
        
        console.log('Registerer bruker:', registarationData);

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
            </form>
        </div>
    </div>
    );
};

export default RegistrationPage;
