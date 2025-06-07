import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../userContext';
import { Navigate } from 'react-router-dom';

function Profile() {
    const userContext = useContext(UserContext);
    const [profile, setProfile] = useState({});
    const [newPassword, setNewPassword] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const getProfile = async () => {
            const res = await fetch("http://localhost:3001/users/profile", {
                credentials: "include"
            });
            const data = await res.json();
            setProfile(data);
        };
        getProfile();
    }, []);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (newPassword !== repeatPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const res = await fetch(`http://localhost:3001/users/${userContext.user._id}/change-password`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    oldPassword,
                    newPassword
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Error updating password');
                return;
            }

            setMessage(data.message || 'Password updated successfully');
            setOldPassword('');
            setNewPassword('');
            setRepeatPassword('');
        } catch (err) {
            console.error("Error updating password:", err);
            setError('Error updating password');
        }
    };

    if (!userContext.user) return <Navigate replace to="/login" />;

    return (
        <div className="container mt-5 text-white d-flex flex-column align-items-center">
            <div className="bg-dark p-4 rounded shadow" style={{maxWidth: '500px', width: '100%'}}>
                <h1 className="text-center mb-4">Profile</h1>
                <p className="text-center"><strong>User:</strong> {profile.username}</p>
                <p className="text-center"><strong>Email:</strong> {profile.email}</p>

                <form onSubmit={handlePasswordChange}>
                    <div className="mb-3">
                        <label htmlFor="oldPassword" className="form-label">Current Password</label>
                        <input
                            type="password"
                            id="oldPassword"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="form-control"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="newPassword" className="form-label">New Password</label>
                        <input
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="form-control"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="repeatPassword" className="form-label">Repeat Password</label>
                        <input
                            type="password"
                            id="repeatPassword"
                            value={repeatPassword}
                            onChange={(e) => setRepeatPassword(e.target.value)}
                            className="form-control"
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">Update Password</button>
                </form>


                {message && <div className="mt-3 alert alert-success">{message}</div>}
                {error && <div className="mt-3 alert alert-danger">{error}</div>}
            </div>
        </div>
    );
}

export default Profile;
