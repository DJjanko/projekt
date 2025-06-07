import { useState } from 'react';

function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [file, setFile] = useState(null);

    async function handleRegister(e) {
        e.preventDefault();
        setError('');

        const res = await fetch("http://localhost:3001/users", {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, password })
        });

        const data = await res.json();

        if (data._id !== undefined) {
            if (file) {
                const formData = new FormData();
                formData.append("file", file, `${username}.jpg`);

                const uploadRes = await fetch("http://localhost:5000/upload", {
                    method: "POST",
                    body: formData
                });

                if (!uploadRes.ok) {
                    setError("Image upload failed");
                    return; // Stop here — do NOT log in
                }
                else{
                    // All checks passed, log user in
                    window.location.href = "/";
                }
            }
            else{
                setError("No Image selected");
            }

        } else {
            setUsername('');
            setPassword('');
            setEmail('');
            setError('Registration failed');
        }
    }

    return (
        <div className="container mt-5 d-flex justify-content-center">
            <div
                className="bg-dark text-white p-4 rounded shadow"
                style={{ maxWidth: '420px', width: '100%', fontSize: '1rem' }}
            >
                <h3 className="text-center mb-4">Register</h3>

                <form onSubmit={handleRegister}>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input
                            type="email"
                            id="email"
                            className="form-control"
                            placeholder="Enter email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="username" className="form-label">Username</label>
                        <input
                            type="text"
                            id="username"
                            className="form-control"
                            placeholder="Enter username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="form-control"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="image" className="form-label">Profile Image (testing)</label>
                        <input
                            type="file"
                            id="image"
                            className="form-control"
                            accept="image/*"
                            onChange={(e) => setFile(e.target.files[0])}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary w-100">Register</button>
                </form>

                {error && <div className="mt-3 alert alert-danger text-center">{error}</div>}
            </div>
        </div>
    );
}

export default Register;
