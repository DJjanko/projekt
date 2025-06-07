import { useContext, useState } from 'react'
import { Navigate } from 'react-router';
import { UserContext } from '../userContext';

function AddPhoto(props) {
    const userContext = useContext(UserContext);
    const [name, setName] = useState('');
    const [description, setDescription] = useState(''); // New state for description
    const [file, setFile] = useState('');
    const [uploaded, setUploaded] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();

        if (!name || !description) {
            alert("Please enter both name and description!");
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description); // Append description to form data
        formData.append('image', file);
        const res = await fetch('http://localhost:3001/photos', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        const data = await res.json();

        setUploaded(true);
    }

    return (
        <form className="form-group" onSubmit={onSubmit}>
            {!userContext.user ? <Navigate replace to="/login" /> : ""}
            {uploaded ? <Navigate replace to="/" /> : ""}
            <input type="text" className="form-control" name="name" placeholder="Name" value={name} onChange={(e) => { setName(e.target.value) }} />
            <textarea className="form-control" name="description" placeholder="Description" value={description} onChange={(e) => { setDescription(e.target.value) }}></textarea> {/* Textarea for description */}
            <label>Choose an image</label>
            <input type="file" id="file" onChange={(e) => { setFile(e.target.files[0]) }} />
            <input className="btn btn-primary" type="submit" name="submit" value="Upload" />
        </form>
    )
}

export default AddPhoto;
