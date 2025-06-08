import { useContext } from "react";
import { UserContext } from "../userContext";
import { Link } from "react-router-dom";

function Header(props) {
    const { user } = useContext(UserContext);

    return (
        <header style={styles.header}>
            <div style={styles.headerContent}>
                <h1 style={styles.title}>{props.title}</h1>
                <nav style={styles.navWrapper}>
                    <ul style={styles.navList}>
                        <li><Link to="/" style={styles.link}>Home</Link></li>
                        {user ? (
                            <>
                                <li><Link to="/mapview" style={styles.link}>MapView</Link></li>
                                <li><Link to="/profile" style={styles.link}>Profile</Link></li>
                                <li><Link to="/logout" style={styles.link}>Logout</Link></li>
                            </>
                        ) : (
                            <>
                                <li><Link to="/login" style={styles.link}>Login</Link></li>
                                {/*<li><Link to="/register" style={styles.link}>Register</Link></li>*/}
                            </>
                        )}
                    </ul>
                </nav>
            </div>
        </header>
    );
}

const styles = {
    header: {
        backgroundColor: '#222',
        color: 'white',
        padding: '10px 20px',
        position: 'relative',
    },
    headerContent: {
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
    },
    title: {
        margin: 0,
        fontSize: '1.8rem',
        flexShrink: 0,
    },
    navWrapper: {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
    },
    navList: {
        listStyle: 'none',
        display: 'flex',
        gap: '20px',
        margin: 0,
        padding: 0,
    },
    link: {
        color: 'white',
        textDecoration: 'none',
        fontSize: '1.1rem',
    }
};

export default Header;
