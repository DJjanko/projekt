import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { UserContext } from "../userContext";

function Comment(props) {
    const {user} = useContext(UserContext);
    const { photoID } = useParams(); // Retrieve the photo ID from the route params
    const [photo, setPhoto] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState([]);


    useEffect(() => {
        // Fetch photo details and comments when the component mounts
        const fetchPhotoDetails = async () => {
            try {
                // Fetch photo details
                const photoResponse = await fetch(`http://localhost:3001/photos/${photoID}`);
                const photoData = await photoResponse.json();
                setPhoto(photoData);

                // Fetch comments associated with the photo
                const commentsResponse = await fetch(`http://localhost:3001/photos/${photoID}/comments`);
                const commentsData = await commentsResponse.json();
                setComments(commentsData);
            } catch (error) {
                console.error('Error fetching photo details or comments:', error);
            }
        };

        fetchPhotoDetails();
    }, [photoID]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();

        try {
            // Send a POST request to add the comment
            const response = await fetch(`http://localhost:3001/photos/${photoID}/createComment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: commentText }), // Include userId in the request body
            });

            if (!response.ok) {
                throw new Error('Failed to add comment');
            }

            // Refresh the comments list by fetching them again
            const commentsResponse = await fetch(`http://localhost:3001/photos/${photoID}/comments`);
            const commentsData = await commentsResponse.json();
            setComments(commentsData);

            // Clear the comment input field
            setCommentText('');
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const handleLikeClick = async () => {
        try {
            // Send a PUT request to update the likes count
            const response = await fetch(`http://localhost:3001/photos/${photoID}/like`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ likes: photo.likes + 1 }), // Increment likes count
            });

            if (!response.ok) {
                throw new Error('Failed to update likes count');
            }

            // Refresh the photo details to update the likes count
            const updatedPhotoResponse = await fetch(`http://localhost:3001/photos/${photoID}`);
            const updatedPhotoData = await updatedPhotoResponse.json();
            setPhoto(updatedPhotoData);
        } catch (error) {
            console.error('Error updating likes count:', error);
        }
    };

    const handleDeletePhoto = async () => {
        try {
            // Send a DELETE request to delete the photo
            const response = await fetch(`http://localhost:3001/photos/${photoID}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete photo');
            }

            // Optionally, you can update the UI after successfully deleting the photo
            // For example, you might want to remove the photo from the list of displayed photos
            // You can do this by filtering out the deleted photo from the photos array

            // Notify the user that the photo was deleted
            window.location.href = '/';
        } catch (error) {
            console.error('Error deleting photo:', error);
            // Handle any errors, such as displaying an error message to the user
            alert('Failed to delete photo. Please try again later.');
        }
    };


    if (!photo) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h2 className="bg-dark text-white">{photo.name}</h2>
            <img src={`http://localhost:3001/${photo.path}`} alt={photo.name} />
            <p className="bg-dark text-white">Description: {photo.description}</p>
            <p className="badge bg-secondary" onClick={handleLikeClick}>Likes: {photo.likes}</p>

            {user && user.id === photo.postedBy.id && (
                <p className="badge bg-warning" onClick={handleDeletePhoto}>
                    Delete
                </p>
            )}

            {/* Display comments */}
            <div>
                <h3>Comments</h3>
                {comments.length > 0 ? (
                    comments.map((comment, index) => (
                        <div key={index}>
                            <p>{comment.text}</p>
                            <hr/>
                        </div>
                    ))
                ) : (
                    <p>No comments available.</p>
                )}
            </div>

            {user &&(
                <>
                    <form onSubmit={handleCommentSubmit}>
                        <label htmlFor="commentText">Add a comment:</label>
                        <textarea
                            id="commentText"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            rows="4"
                            cols="50"
                        ></textarea>
                        <br/>
                        <button type="submit">Submit</button>
                    </form>
                </>
            )}
        </div>
    );
}

export default Comment;