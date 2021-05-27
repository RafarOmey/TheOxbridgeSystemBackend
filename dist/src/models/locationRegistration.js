"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationRegistration = void 0;
const mongoose_1 = require("mongoose");
const LocationRegistrationSchema = new mongoose_1.Schema({
    regId: { type: Number },
    eventRegId: { type: Number },
    locationTime: { type: Date },
    longtitude: { type: Number },
    latitude: { type: Number },
    racePointNumber: { type: Number },
    raceScore: { type: Number },
    finishTime: { type: Date }
});
const LocationRegistration = mongoose_1.model('LocationRegistration', LocationRegistrationSchema);
exports.LocationRegistration = LocationRegistration;
//# sourceMappingURL=locationRegistration.js.map