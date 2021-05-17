var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LocationRegistrationSchema = new Schema({
    regId: Number,
    eventRegId: Number,
    locationTime: Date,
    longtitude: Number,
    latitude: Number,
    racePointNumber : Number,
    raceScore : Number,
    finishTime : Date,
});

module.exports = mongoose.model('LocationRegistration', LocationRegistrationSchema);