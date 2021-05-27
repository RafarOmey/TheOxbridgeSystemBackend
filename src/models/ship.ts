import {model, Schema, Model, Document} from 'mongoose';

interface IShip extends Document {
    shipId: number,
    emailUsername: string,
    name: string
}


const ShipSchema = new Schema({
    shipId: {type: Number},
    emailUsername: {type: String},
    name: {type: String}
});

const Ship: Model<IShip> = model('Ship', ShipSchema);

export{Ship,IShip}