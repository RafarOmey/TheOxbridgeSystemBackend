import {model, Schema, Model, Document} from 'mongoose';

interface IUser extends Document {
    firstname: String,
    lastname: String,
    emailUsername: String,
    password: String,
    role: String
}

const UserSchema = new Schema({
    firstname: {type: String},
    lastname: {type: String},
    emailUsername: {type: String},
    password: {type: String},
    role: {type: String},
});

const User: Model<IUser> = model('User', UserSchema);

export{User, IUser}