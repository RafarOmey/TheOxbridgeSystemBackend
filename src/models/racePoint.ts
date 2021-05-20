import {model, Schema, Model, Document} from 'mongoose';

interface IRacePoint extends Document {
    racePointId: Number,
    type: String,
    firstLongtitude : Number,
    firstLatitude : Number,
    secondLongtitude : Number,
    secondLatitude : Number,
    eventId: Number,
    racePointNumber : Number
}
const RacePointSchema = new Schema({
    racePointId: {type: Number},
    type: {type: String},
    firstLongtitude : {type: Number},
    firstLatitude : {type: Number},
    secondLongtitude : {type: Number},
    secondLatitude : {type: Number},
    eventId: {type: Number},
    racePointNumber : {type: Number}

});

const RacePoint: Model<IRacePoint> = model('RacePoint',RacePointSchema);

export{RacePoint,IRacePoint}