import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { UserContext } from "../userContext";

function Comment(props) {
    const { user } = useContext(UserContext);
    const { photoID } = useParams();
    const [photo, setPhoto] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState([]);

    useEffect(() => {
        const fetchPhotoDetails = async () => {
            try {
                const photoResponse = await fetch(`http://localhost:3001/photos/${photoID}`);
                const photoData = await photoResponse.json();
                setPhoto(photoData);

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
            const response = await fetch(`http://localhost:3001/photos/${photoID}/createComment`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: commentText }),
            });

            if (!response.ok) throw new Error('Failed to add comment');

            const commentsResponse = await fetch(`http://localhost:3001/photos/${photoID}/comments`);
            const commentsData = await commentsResponse.json();
            setComments(commentsData);
            setCommentText('');
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const handleLikeClick = async () => {
        try {
            const response = await fetch(`http://localhost:3001/photos/${photoID}/like`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ likes: photo.likes + 1 }),
            });

            if (!response.ok) throw new Error('Failed to update likes count');

            const updatedPhotoResponse = await fetch(`http://localhost:3001/photos/${photoID}`);
            const updatedPhotoData = await updatedPhotoResponse.json();
            setPhoto(updatedPhotoData);
        } catch (error) {
            console.error('Error updating likes count:', error);
        }
    };

    const handleDeletePhoto = async () => {
        try {
            const response = await fetch(`http://localhost:3001/photos/${photoID}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete photo');
            window.location.href = '/';
        } catch (error) {
            console.error('Error deleting photo:', error);
            alert('Failed to delete photo. Please try again later.');
        }
    };

    if (!photo) return <div>Loading...</div>;

    return (
        <div className="container mt-4 text-white">
            {/* Title */}
            <h2 className="text-center bg-dark text-white p-2">{photo.name}</h2>

            {/* Image */}
            <div className="d-flex justify-content-center">
                <img
                    src={`http://localhost:3001/${photo.path}`}
                    alt={photo.name}
                    style={{ maxWidth: '600px', width: '100%', display: 'block', marginBottom: '10px' }}
                />
            </div>

            {/* Author and Date (right-aligned) */}
            <div className="text-end text-muted mb-3">
                Posted by <strong>{photo.postedBy?.username || 'Unknown'}</strong> on{' '}
                {new Date(photo.date).toLocaleString()}
            </div>

            {/* Description */}
            <p className="bg-dark p-2">Description: {photo.sporocilo}</p>

            {/* Likes and Delete */}
            <p
                className="badge bg-secondary me-2"
                onClick={handleLikeClick}
                style={{ cursor: 'pointer' }}
            >
                {/*Likes: {photo.likes}*/}
            </p>

            {user && user._id === String(photo.postedBy?._id) && (
                <div className="mb-3 text-end">
                    <button
                        className="btn btn-danger"
                        onClick={handleDeletePhoto}
                    >
                        Delete Photo
                    </button>
                </div>
            )}

            {/* Comments */}
            <div className="mt-4 bg-dark text-white p-3 rounded">
                <h3>Comments</h3>
                {comments.length > 0 ? (
                    comments.map((comment, index) => (
                        <div
                            key={index}
                            className={`p-3 mb-3 rounded ${index % 2 === 0 ? 'bg-secondary' : 'bg-dark'}`}
                        >
                            {/* Top-left: Username */}
                            <div className="d-flex justify-content-between">
                                <strong>{comment.postedBy?.username || "Anonymous"}</strong>
                                <small className="text-light">
                                    {new Date(comment.date).toLocaleString()}
                                </small>
                            </div>

                            {/* Comment Text */}
                            <p className="mt-2 mb-0">{comment.text}</p>
                        </div>
                    ))
                ) : (
                    <p>No comments available.</p>
                )}
            </div>

            {/* Comment Form */}
            {user && (
                <form onSubmit={handleCommentSubmit} className="mt-3">
                    <label htmlFor="commentText">Add a comment:</label>
                    <textarea
                        id="commentText"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        rows="4"
                        cols="50"
                        className="form-control mb-2"
                    ></textarea>
                    <button type="submit" className="btn btn-primary">Submit</button>
                </form>
            )}
        </div>
    );
}

export default Comment;
