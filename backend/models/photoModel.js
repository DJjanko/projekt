var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var photoSchema = new Schema({
    'name' : String,
    'path' : String,
    'postedBy' : {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    'views' : Number,
    'likes' : Number,
    'date': { type: Date, default: Date.now },
    'sporocilo' : String,
    'db': Number,
    location: {
        latitude: Number,
        longitude: Number
    }
});

module.exports = mongoose.model('photo', photoSchema);
