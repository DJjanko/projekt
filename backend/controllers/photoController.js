var PhotoModel = require('../models/photoModel.js');
var Comment = require('../models/commentModel.js');

const fs = require('fs');
const path = require('path');

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
        const id = req.params.id;

        PhotoModel.findOne({ _id: id })
            .populate('postedBy', 'username') // ✅ Only get the username field from the user
            .exec(function (err, photo) {
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
        console.log('--- Creating Photo ---');
        console.log('REQ.BODY:', req.body);
        console.log('REQ.FILE:', req.file);
        console.log('REQ.SESSION:', req.session);

        if (!req.file) {
            console.log('❌ No file received');
            return res.status(400).json({ message: 'No image file received' });
        }

        const photo = new PhotoModel({
            name: req.body.name,
            path: '/images/' + req.file.filename,
            postedBy: req.session?.userId || null,
            views: 0,
            likes: 0,
            date: new Date(),
            sporocilo: req.body.sporocilo,
        });

        console.log('PHOTO OBJECT:', photo);

        photo.save((err, savedPhoto) => {
            if (err) {
                console.error('❌ Save error:', err);
                return res.status(500).json({ message: 'DB save error', error: err });
            }

            console.log('✅ Photo saved:', savedPhoto);
            res.status(201).json(savedPhoto);
        });
    },



    /**
     * photoController.update()
     */
    update: function (req, res) {
        var id = req.params.id;

        PhotoModel.findOne({ _id: id }, function (err, photo) {
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

            // Standard fields
            photo.name = req.body.name !== undefined ? req.body.name : photo.name;
            photo.path = req.body.path !== undefined ? req.body.path : photo.path;
            photo.postedBy = req.body.postedBy !== undefined ? req.body.postedBy : photo.postedBy;
            photo.views = req.body.views !== undefined ? req.body.views : photo.views;
            photo.likes = req.body.likes !== undefined ? req.body.likes : photo.likes;
            photo.sporocilo = req.body.sporocilo !== undefined ? req.body.sporocilo : photo.sporocilo;

            // ✅ Add these:
            if (req.body.db !== undefined) {
                photo.db = req.body.db;
            }

            if (req.body.location !== undefined && req.body.location.latitude && req.body.location.longitude) {
                photo.location = {
                    latitude: req.body.location.latitude,
                    longitude: req.body.location.longitude
                };
            }

            photo.save(function (err, updatedPhoto) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when updating photo.',
                        error: err
                    });
                }

                return res.json(updatedPhoto);
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
        console.log('Photo ID:', photoId);

        Comment.find({ photo: photoId })
            .populate('postedBy')
            .exec(function (err, comments) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when getting comments for photo.',
                        error: err
                    });
                }

                if (!comments || comments.length === 0) {
                    return res.status(404).json({
                        message: 'No comments found for the photo with ID: ' + photoId
                    });
                }

                return res.json(comments);
            });
    }
    ,
    createComment: function (req, res) {
        const photoId = req.params.id;
        console.log("UserID" + req.session.userId);
        // Create a new comment object
        const newComment = new Comment({
            text: req.body.text,
            postedBy: req.session.userId, // Capture the user who posted the comment
            photo: photoId,
            date: new Date()
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

    /**
     * photoController.like()
     */
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
    },
    createFromBase64: function (req, res) {
        const { name, sporocilo, image, db, location } = req.body;
        const userId = req.session?.userId;
        console.log("📍 Received location:", location);

        if (!image || !name || !sporocilo) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const buffer = Buffer.from(image, 'base64');
        const filename = Date.now() + '.jpg';
        const filePath = path.join('public/images', filename);

        fs.writeFile(filePath, buffer, async (err) => {
            if (err) {
                console.error('❌ Error saving image:', err);
                return res.status(500).json({ message: 'Failed to save image file' });
            }

            const photo = new PhotoModel({
                name,
                sporocilo,
                path: '/images/' + filename,
                postedBy: userId || null,
                views: 0,
                likes: 0,
                date: new Date(),
                db: db !== undefined ? db : null,
                location: location || null,
            });

            try {
                const savedPhoto = await photo.save();
                console.log('✅ Base64 photo saved:', savedPhoto);
                res.status(201).json(savedPhoto);
            } catch (saveErr) {
                console.error('❌ DB error:', saveErr);
                res.status(500).json({ message: 'DB save failed' });
            }
        });
    },
};
