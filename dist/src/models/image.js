"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Image = void 0;
const mongoose_1 = require("mongoose");
const ImageSchema = new mongoose_1.Schema({
    name: { type: String },
    data: { type: Buffer },
});
const Image = mongoose_1.model('Image', ImageSchema);
exports.Image = Image;
//# sourceMappingURL=image.js.map