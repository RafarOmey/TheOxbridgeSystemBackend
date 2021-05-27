"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = void 0;
const mongoose_1 = require("mongoose");
const EventSchema = new mongoose_1.Schema({
    eventId: { type: Number },
    name: { type: String },
    eventStart: { type: Date },
    eventEnd: { type: Date },
    city: { type: String },
    eventCode: { type: String },
    actualEventStart: { type: Date },
    isLive: { type: Boolean }
});
const Event = mongoose_1.model('Event', EventSchema);
exports.Event = Event;
//# sourceMappingURL=event.js.map