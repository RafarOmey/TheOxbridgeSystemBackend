import {model, Schema, Model, Document} from 'mongoose';

interface IEvent extends Document {
    eventId: Number,
    name: String,
    eventStart: Date,
    eventEnd: Date,
    city: String,
    eventCode: String,
    actualEventStart : Date,
    isLive : Boolean
}

const EventSchema : Schema = new Schema({
    eventId: {type: Number},
    name: {type: String},
    eventStart: {type: Date},
    eventEnd: {type: Date},
    city: {type: String},
    eventCode: {type: String},
    actualEventStart : {type: Date},
    isLive : {type: Boolean}
});

const Event : Model<IEvent> = model('Event', EventSchema);

export {Event, IEvent}