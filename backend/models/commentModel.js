var mongoose = require('mongoose');

var commentSchema = new mongoose.Schema({
    text: { type: String, required: true },
    photo: { type: mongoose.Schema.Types.ObjectId, ref: 'photo', required: true }
});
var Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;