"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RacePoint = void 0;
const mongoose_1 = require("mongoose");
const RacePointSchema = new mongoose_1.Schema({
    racePointId: { type: Number },
    type: { type: String },
    firstLongtitude: { type: Number },
    firstLatitude: { type: Number },
    secondLongtitude: { type: Number },
    secondLatitude: { type: Number },
    eventId: { type: Number },
    racePointNumber: { type: Number }
});
const RacePoint = mongoose_1.model('RacePoint', RacePointSchema);
exports.RacePoint = RacePoint;
//# sourceMappingURL=racePoint.js.map