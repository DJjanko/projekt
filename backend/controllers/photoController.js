var PhotoModel = require('../models/photoModel.js');
var Comment = require('../models/commentModel.js');

/**
 * photoController.js
 *
 * @description :: Server-side logic for managing photos.
 */
module.exports = {

    /**
     * photoController.list()
     */
    list: function (req, res) {
        PhotoModel.find()
            .populate('postedBy')
            .sort({ date: -1 }) // Sort by date in descending order
            .exec(function (err, photos) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when getting photo.',
                        error: err
                    });
                }
                var data = [];
                data.photos = photos;
                //return res.render('photo/list', data);
                return res.json(photos);
            });
    },

    /**
     * photoController.show()
     */
    show: function (req, res) {
        var id = req.params.id;

        PhotoModel.findOne({_id: id}, function (err, photo) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting photo.',
                    error: err
                });
            }

            if (!photo) {
                return res.status(404).json({
                    message: 'No such photo'
                });
            }

            return res.json(photo);
        });
    },

    /**
     * photoController.create()
     */
    create: function (req, res) {
        var photo = new PhotoModel({
			name : req.body.name,
			path : "/images/"+req.file.filename,
			postedBy : req.session.userId,
			views : 0,
            description : req.body.description,
			likes : 0,
            date : new Date()
        });

        photo.save(function (err, photo) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when creating photo',
                    error: err
                });
            }

            return res.status(201).json(photo);
            //return res.redirect('/photos');
        });
    },

    /**
     * photoController.update()
     */
    update: function (req, res) {
        var id = req.params.id;

        PhotoModel.findOne({_id: id}, function (err, photo) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting photo',
                    error: err
                });
            }

            if (!photo) {
                return res.status(404).json({
                    message: 'No such photo'
                });
            }

            photo.name = req.body.name ? req.body.name : photo.name;
			photo.path = req.body.path ? req.body.path : photo.path;
			photo.postedBy = req.body.postedBy ? req.body.postedBy : photo.postedBy;
			photo.views = req.body.views ? req.body.views : photo.views;
			photo.likes = req.body.likes ? req.body.likes : photo.likes;
			
            photo.save(function (err, photo) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when updating photo.',
                        error: err
                    });
                }

                return res.json(photo);
            });
        });
    },

    /**
     * photoController.remove()
     */
    remove: function (req, res) {
        var id = req.params.id;

        // Delete all comments associated with the photo
            Comment.deleteMany({ photo: id }, function (err) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when deleting comments for the photo.',
                    error: err
                });
            }

            // Now that comments are deleted, delete the photo
            PhotoModel.findByIdAndRemove(id, function (err, photo) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when deleting the photo.',
                        error: err
                    });
                }

                return res.status(204).json();
            });
        });
    },

    publish: function(req, res){
        return res.render('photo/publish');
    },
    comments: function (req, res) {
        const photoId = req.params.id;

        // Find all comments associated with the given photo ID
        Comment.find({ photo: photoId }, function (err, comments) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting comments for photo.',
                    error: err
                });
            }

            // If no comments are found, return an empty array
            if (!comments || comments.length === 0) {
                return res.status(404).json({
                    message: 'No comments found for the photo with ID: ' + photoId
                });
            }

            // Return the retrieved comments as a JSON response
            return res.json(comments);
        });
    },
    createComment: function (req, res) {
        const photoId = req.params.id;
        // Create a new comment object
        const newComment = new Comment({
            text: req.body.text,
            photo: photoId
        });

        // Save the new comment to the database
        newComment.save(function (err, comment) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when creating comment.',
                    error: err
                });
            }

            return res.status(201).json(comment);
        });
    },

    // Function to delete a comment
    deleteComment: function (req, res) {
        const commentId = req.params.id_comment;

        // Find the comment by ID and remove it from the database
        Comment.findByIdAndRemove(commentId, function (err, comment) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when deleting comment.',
                    error: err
                });
            }

            if (!comment) {
                return res.status(404).json({
                    message: 'Comment not found.'
                });
            }

            return res.status(204).json(); // Return 204 (No Content) status for successful deletion
        });
    },
    like: function (req, res) {
        const id = req.params.id;
        const newLikesCount = req.body.likes;

        PhotoModel.findOneAndUpdate(
            { _id: id },
            { likes: newLikesCount },
            { new: true },
            function (err, photo) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when updating likes count for photo.',
                        error: err
                    });
                }

                if (!photo) {
                    return res.status(404).json({
                        message: 'Photo not found.'
                    });
                }

                return res.json(photo);
            }
        );
    }
};
