"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Broadcast = void 0;
const mongoose_1 = require("mongoose");
const BroadcastSchema = new mongoose_1.Schema({
    eventId: { type: Number },
    message: { type: String },
    emailUsername: { type: String },
    hasBeenRead: { type: Boolean }
});
const Broadcast = mongoose_1.model('Broadcast', BroadcastSchema);
exports.Broadcast = Broadcast;
//# sourceMappingURL=broadcast.js.map