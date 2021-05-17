var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var racePointSchema = new Schema({
    racePointId: Number,
    type: String, 
    firstLongtitude : Number,
    firstLatitude : Number, 
    secondLongtitude : Number,
    secondLatitude : Number,
    eventId: Number,
    racePointNumber : Number 
    
});
module.exports = mongoose.model('racePoint', racePointSchema);