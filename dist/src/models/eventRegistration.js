"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventRegistration = void 0;
const mongoose_1 = require("mongoose");
const EventRegistrationSchema = new mongoose_1.Schema({
    eventRegId: { type: Number },
    shipId: { type: Number },
    eventId: { type: Number },
    trackColor: { type: String },
    teamName: { type: String }
});
const EventRegistration = mongoose_1.model('EventRegistration', EventRegistrationSchema);
exports.EventRegistration = EventRegistration;
//# sourceMappingURL=eventRegistration.js.map