var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EventRegistrationSchema = new Schema({
    eventRegId: Number,
    shipId : Number,
    eventId : Number,
    trackColor : String,
    teamName : String
});

module.exports = mongoose.model('EventRegistration', EventRegistrationSchema);