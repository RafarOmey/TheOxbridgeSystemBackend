import {model, Schema, Model, Document} from 'mongoose';

interface IShip extends Document {
    shipId: Number,
    emailUsername: String,
    name: String
}


const ShipSchema = new Schema({
    shipId: {type: Number},
    emailUsername: {type: String},
    name: {type: String}
});

const Ship: Model<IShip> = model('Ship', ShipSchema);

export{Ship,IShip}