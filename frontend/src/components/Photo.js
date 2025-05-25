import { useState, useContext } from 'react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import { UserContext } from "../userContext";

function Photo(props) {
    const { user } = useContext(UserContext);

    return (
        <div className="card bg-dark text-dark mb-2 d-flex flex-row">
            {/* Use Link component to navigate to the /comment route with photo ID as URL parameter */}
            <Link to={`/comment/${props.photo._id}`} style={{textDecoration: 'none', color: 'inherit'}}>


                <div>
                    <img className="card-img" src={"http://localhost:3001/"+ props.photo.path} alt={props.photo.name}/>
                </div>
                <div className="card-img-overlay">
                    <h5 className="card-title bg-dark text-white">{props.photo.name}</h5>
                    <p className="bg-dark text-white">Description: {props.photo.description}</p>
                    <p className="bg-dark text-white">Author: {props.photo.postedBy.username}</p>
                    <p className="bg-dark text-white">Posted: {new Date(props.photo.date).toLocaleString()}</p>{/* Display description */}
                    <span className="badge bg-secondary">Likes: {props.photo.likes}</span>
                </div>
            </Link>
        </div>
    );
}

export default Photo;
