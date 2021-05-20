import {model, Schema, Model, Document} from 'mongoose';

interface ILocationRegistration extends Document {
    regId: Number,
    eventRegId: Number,
    locationTime: Date,
    longtitude: Number,
    latitude: Number,
    racePointNumber : Number,
    raceScore : Number,
    finishTime : Date,
}

const LocationRegistrationSchema :Schema = new Schema({
    regId: {type: Number},
    eventRegId: {type: Number},
    locationTime: {type: Date},
    longtitude: {type: Number},
    latitude: {type: Number},
    racePointNumber : {type: Number},
    raceScore : {type: Number},
    finishTime : {type: Date}
});

const LocationRegistration : Model<ILocationRegistration> = model('LocationRegistration',LocationRegistrationSchema);

export {LocationRegistration, ILocationRegistration}