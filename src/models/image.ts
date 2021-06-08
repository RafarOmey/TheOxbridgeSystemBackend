import {model, Schema, Model, Document} from 'mongoose';

interface IImage extends Document {
    name: string,
    img:
    {
        data: Buffer,
        contentType: string
    }
}

const ImageSchema : Schema = new Schema({
    name: {type: String},
    img:{
        data: {type: Buffer},
        contentType: {type:String}
    }
});

const Image : Model<IImage> = model('Image', ImageSchema);

export {Image, IImage}