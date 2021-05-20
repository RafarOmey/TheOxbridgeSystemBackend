import {model, Schema, Model, Document} from 'mongoose';

interface IEventRegistration extends Document {
    eventRegId: Number,
    shipId : Number,
    eventId : Number,
    trackColor : String,
    teamName : String
}
const EventRegistrationSchema : Schema = new Schema({
    eventRegId: {type: Number},
    shipId : {type: Number},
    eventId : {type: Number},
    trackColor : {type: String},
    teamName : {type: String}
});

const EventRegistration : Model<IEventRegistration> = model('EventRegistration', EventRegistrationSchema)

export {EventRegistration,IEventRegistration}