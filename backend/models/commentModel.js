var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var commentSchema = new Schema({
    'text' : String,
    'postedBy' : {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    'photo' : {
        type: Schema.Types.ObjectId,
        ref: 'photo'
    },
    'date': { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comment', commentSchema);