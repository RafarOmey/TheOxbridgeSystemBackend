var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ShipSchema = new Schema({
    shipId: Number,
    emailUsername: String,
    name: String
});
module.exports = mongoose.model('Ship', ShipSchema);