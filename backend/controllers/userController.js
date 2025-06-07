const bcrypt = require('bcrypt');

var UserModel = require('../models/userModel.js');

/**
 * userController.js
 *
 * @description :: Server-side logic for managing users.
 */
module.exports = {

    /**
     * userController.list()
     */
    list: function (req, res) {
        UserModel.find(function (err, users) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting user.',
                    error: err
                });
            }

            return res.json(users);
        });
    },

    /**
     * userController.show()
     */
    show: function (req, res) {
        var id = req.params.id;

        UserModel.findOne({_id: id}, function (err, user) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting user.',
                    error: err
                });
            }

            if (!user) {
                return res.status(404).json({
                    message: 'No such user'
                });
            }

            return res.json(user);
        });
    },

    /**
     * userController.create()
     */
    create: function (req, res) {
        // First, check if a user with the given username already exists
        UserModel.findOne({ username: req.body.username }, function (err, existingUser) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when checking existing user',
                    error: err
                });
            }

            if (existingUser) {
                console.log("User already exists!");
                return res.status(400).json({
                    message: 'Username already taken'
                });
            }

            // If username is unique, proceed to create new user
            var user = new UserModel({
                username: req.body.username,
                password: req.body.password,
                email: req.body.email
            });

            user.save(function (err, user) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when creating user',
                        error: err
                    });
                }

                return res.status(201).json(user);
            });
        });
    },

    /**
     * userController.update()
     */
    update: function (req, res) {
        var id = req.params.id;

        UserModel.findOne({_id: id}, function (err, user) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting user',
                    error: err
                });
            }

            if (!user) {
                return res.status(404).json({
                    message: 'No such user'
                });
            }

            user.username = req.body.username ? req.body.username : user.username;
            user.password = req.body.password ? req.body.password : user.password;
            user.email = req.body.email ? req.body.email : user.email;

            user.save(function (err, user) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when updating user.',
                        error: err
                    });
                }

                return res.json(user);
            });
        });
    },

    /**
     * userController.remove()
     */
    remove: function (req, res) {
        var id = req.params.id;

        UserModel.findByIdAndRemove(id, function (err, user) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when deleting the user.',
                    error: err
                });
            }

            return res.status(204).json();
        });
    },

    showRegister: function(req, res){
        res.render('user/register');
    },

    showLogin: function(req, res){
        res.render('user/login');
    },

    login: function(req, res, next){
        UserModel.authenticate(req.body.username, req.body.password, function(err, user){
            if(err || !user){
                var err = new Error('Wrong username or paassword');
                err.status = 401;
                return next(err);
            }
            req.session.userId = user._id;
            //res.redirect('/users/profile');
            return res.json(user);
        });
    },

    profile: function(req, res,next){
        console.log(req.session.userId)
        UserModel.findById(req.session.userId)
            .exec(function(error, user){
                if(error){
                    return next(error);
                } else{
                    if(user===null){
                        var err = new Error('Not authorized, go back!');
                        err.status = 400;
                        return next(err);
                    } else{
                        //return res.render('user/profile', user);
                        return res.json(user);
                    }
                }
            });
    },
    changePassword: async function (req, res) {
        const userId = req.session.userId;
        const { oldPassword, newPassword } = req.body;

        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        try {
            const user = await UserModel.findById(userId);
            if (!user) return res.status(404).json({ error: "User not found" });

            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) return res.status(400).json({ error: "Incorrect current password" });

            user.password = newPassword; // will be hashed by pre-save hook
            await user.save();

            res.json({ message: "Password updated successfully" });
        } catch (err) {
            console.error('Change password error:', err); // 👈 log the real error
            res.status(500).json({ error: "Server error" });
        }
    },

    logout: function(req, res, next){
        if(req.session){
            req.session.destroy(function(err){
                if(err){
                    return next(err);
                } else{
                    //return res.redirect('/');
                    return res.status(201).json({});
                }
            });
        }
    },

};
