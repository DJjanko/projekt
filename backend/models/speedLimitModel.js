var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var speedLimitSchema = new Schema({
    'id' : Number,
    'latitude' : Number,
    'longitude' : Number,
    'speedLimit' : Number
});

module.exports = mongoose.model('speedLimit', speedLimitSchema);
