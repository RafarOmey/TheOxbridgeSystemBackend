import { model, Schema, Model, Document } from 'mongoose';

interface IBroadcast extends Document {
    eventId: string,
    message: string,
    emailUsername: string,
}

const BroadcastSchema: Schema = new Schema({
    eventId: { type: Number },
    message: { type: String },
    emailUsername: { type: String },
});

const Broadcast: Model<IBroadcast> = model('Broadcast', BroadcastSchema);

export { Broadcast, IBroadcast }