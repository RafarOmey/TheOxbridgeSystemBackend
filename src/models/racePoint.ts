import {model, Schema, Model, Document} from 'mongoose';

interface IRacePoint extends Document {
    racePointId: number,
    type: string,
    firstLongtitude : number,
    firstLatitude : number,
    secondLongtitude : number,
    secondLatitude : number,
    eventId: number,
    racePointNumber : number
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