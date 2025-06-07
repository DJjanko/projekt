import { useContext, useState, useEffect, useRef } from 'react';
import { UserContext } from '../userContext';
import { Navigate } from 'react-router-dom';
import mqtt from 'mqtt';
import { LOCAL_IP } from '../ipConfig';

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const userContext = useContext(UserContext);

    const mqttClient = useRef(null);
    const [mqttConnected, setMqttConnected] = useState(false);

    useEffect(() => {
        // Connect to MQTT broker
        const client = mqtt.connect(`ws://${LOCAL_IP}:9001`);
        mqttClient.current = client;

        client.on('connect', () => {
            console.log('Web MQTT connected');
            setMqttConnected(true);
        });

        client.on('error', (err) => {
            console.error('Web MQTT error:', err);
        });

        // Cleanup on unmount
        return () => {
            if (client) {
                client.end();
            }
        };
    }, []);

    async function handleLogin(e) {
        e.preventDefault();
        setError("");  // Clear old error

        try {
            // 1️⃣ Step 1: Basic username/password auth first
            const res = await fetch(`http://${LOCAL_IP}:3001/users/login`, {
                method: "POST",
                credentials: "include",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    password
                })
            });

            const data = await res.json();

            if (data._id !== undefined) {
                // 2️⃣ Step 2: Publish login_challenge via MQTT
                const challengeTopic = `login_challenge/${username}`;
                mqttClient.current.publish(challengeTopic, 'please_scan_face');
                console.log(` Published "please_scan_face" to ${challengeTopic}`);

                // 3️⃣ Step 3: Subscribe to login_response/username
                const responseTopic = `login_response/${username}`;
                mqttClient.current.subscribe(responseTopic, (err) => {
                    if (err) {
                        console.error(' Failed to subscribe to login_response:', err);
                        setError('Failed to subscribe to login response');
                        return;
                    }
                    console.log(`Subscribed to ${responseTopic}`);
                });

                // 4️⃣ Step 4: Wait for response with timeout (15 seconds)
                let timeoutHandle = null;
                const waitForResponse = new Promise((resolve) => {
                    mqttClient.current.on('message', (topic, message) => {
                        if (topic === responseTopic) {
                            const payload = message.toString();
                            console.log(` Received login_response: ${payload}`);
                            clearTimeout(timeoutHandle);
                            resolve(payload);
                        }
                    });

                    // Timeout after 60 seconds
                    timeoutHandle = setTimeout(() => {
                        console.log(' Login response timeout');
                        resolve('timeout');
                    }, 60000);
                });

                const loginResponse = await waitForResponse;

                // 5️⃣ Step 5: Process response
                if (loginResponse === 'ok') {
                    console.log(' Face verified, proceeding to login');
                    userContext.setUserContext(data); // All checks passed
                } else if (loginResponse === 'fail') {
                    setError("Face verification failed");
                } else if (loginResponse === 'timeout') {
                    setError("No response from mobile device (timeout)");
                }

                //  Cleanup: unsubscribe to avoid leaks
                mqttClient.current.unsubscribe(responseTopic, () => {
                    console.log(` Unsubscribed from ${responseTopic}`);
                });
            } else {
                setUsername("");
                setPassword("");
                setError("Invalid username or password");
            }
        } catch (err) {
            console.error(err);
            setError("Network error");
        }
    }

    if (userContext.user) return <Navigate replace to="/" />;

    return (
        <div className="container mt-5 d-flex justify-content-center">
            <div
                className="bg-dark text-white p-4 rounded shadow"
                style={{ maxWidth: '420px', width: '100%', fontSize: '1rem' }}
            >
                <h3 className="text-center mb-4">Login</h3>

                <form onSubmit={handleLogin}>
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

                    <button type="submit" className="btn btn-primary w-100" disabled={!mqttConnected}>
                        {mqttConnected ? 'Log In' : 'Connecting...'}
                    </button>
                </form>

                {error && <div className="mt-3 alert alert-danger text-center">{error}</div>}
            </div>
        </div>
    );
}

export default Login;
