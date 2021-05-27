"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ship = void 0;
const mongoose_1 = require("mongoose");
const ShipSchema = new mongoose_1.Schema({
    shipId: { type: Number },
    emailUsername: { type: String },
    name: { type: String }
});
const Ship = mongoose_1.model('Ship', ShipSchema);
exports.Ship = Ship;
//# sourceMappingURL=ship.js.map