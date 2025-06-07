import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from "../userContext";

function Photo(props) {
    const { user } = useContext(UserContext);
    const { photo } = props;

    return (
        <div className="card bg-dark text-dark mb-3 p-2" style={{ maxWidth: '420px' }}>
            <Link to={`/comment/${photo._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                {/* Top Text Section */}
                <div className="card-body text-white">
                    <h5 className="card-title">{photo.name}</h5>
                    <p className="card-text">Description: {photo.sporocilo}</p>
                    <div className="d-flex justify-content-between">
                        <p className="mb-0">Author: {photo.postedBy?.username || 'Unknown'}</p>
                        <p className="mb-0">Posted: {new Date(photo.date).toLocaleString()}</p>
                    </div>
                </div>

                {/* Image */}
                <img
                    className="card-img-top"
                    src={`http://localhost:3001/${photo.path}`}
                    alt={photo.name}
                    style={{ width: '400px', objectFit: 'cover' }}
                />

                {/* Bottom Section */}
                <div className="card-body text-white">
                    {/*<span className="badge bg-secondary me-2">Likes: {photo.likes}</span>*/}
                    <span className="badge bg-info me-2">
                        DB: {photo.db !== null && photo.db !== undefined ? photo.db.toFixed(2) : 'N/A'}
                    </span>
                    {photo.location && (
                        <div className="mt-2">
                            <p>Location:</p>
                            <p>Latitude: {photo.location.latitude}</p>
                            <p>Longitude: {photo.location.longitude}</p>
                        </div>
                    )}
                </div>
            </Link>
        </div>
    );
}

export default Photo;
