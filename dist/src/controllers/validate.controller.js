"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validate = void 0;
const event_1 = require("../models/event");
const eventRegistration_1 = require("../models/eventRegistration");
const ship_1 = require("../models/ship");
const locationRegistration_1 = require("../models/locationRegistration");
const racePoint_1 = require("../models/racePoint");
class Validate {
    // Validates if the ship and the event exists
    static validateEventForeignKeys(registration, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // Checking if ship exists
            const ship = yield ship_1.Ship.findOne({ shipId: registration.shipId });
            if (!ship) {
                return false;
            }
            // Checking if event exists
            const event = yield event_1.Event.findOne({ eventId: registration.eventId });
            if (!event) {
                return false;
            }
        });
    }
    // Creates a registration
    static createRegistration(newRegistration, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // const val: boolean = await this.validateEventForeignKeys(newRegistration, res);
            // if (!val) {
            //     return null;
            // }
            // Finding next eventRegId
            const lastEventRegistration = yield eventRegistration_1.EventRegistration.findOne({}, {}, { sort: { eventRegId: -1 } });
            const one = 1;
            if (lastEventRegistration)
                newRegistration.eventRegId = lastEventRegistration.eventRegId + one;
            else
                newRegistration.eventRegId = 1;
            newRegistration.save();
            return newRegistration;
        });
    }
    static FindDistance(registration, racePoint) {
        const checkPoint1 = {
            longtitude: Number,
            latitude: Number
        };
        const checkPoint2 = {
            longtitude: Number,
            latitude: Number
        };
        checkPoint1.longtitude = racePoint.firstLongtitude;
        checkPoint1.latitude = racePoint.firstLatitude;
        checkPoint2.longtitude = racePoint.secondLongtitude;
        checkPoint2.latitude = racePoint.secondLatitude;
        const AB = Validate.CalculateDistance(checkPoint1, checkPoint2);
        const BC = Validate.CalculateDistance(checkPoint2, registration);
        const AC = Validate.CalculateDistance(checkPoint1, registration);
        const P = (AB + BC + AC) / 2;
        const S = Math.sqrt(P * (P - AC) * (P - AB) * (P - AC));
        const result = 2 * S / AB;
        return result;
    }
    static CalculateDistance(checkPoint1, checkPoint2) {
        const R = 6371e3; // metres
        const φ1 = checkPoint1.latitude * Math.PI / 180; // φ, λ in radians
        const φ2 = checkPoint2.latitude * Math.PI / 180;
        const Δφ = (checkPoint2.latitude - checkPoint1.latitude) * Math.PI / 180;
        const Δλ = (checkPoint2.longtitude - checkPoint1.longtitude) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        // noinspection UnnecessaryLocalVariableJS
        const d = R * c;
        return d;
    }
    // Validates if the eventreg exists
    static validateLocationForeignKeys(registration, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // Checking if eventReg exists
            const eventReg = yield eventRegistration_1.EventRegistration.findOne({ eventRegId: registration.eventRegId });
            if (!eventReg) {
                return false;
            }
            return true;
        });
    }
    static CheckRacePoint(registration, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const eventRegistration = yield eventRegistration_1.EventRegistration.findOne({ eventRegId: registration.eventRegId }, { _id: 0, __v: 0 });
            // Checks which racepoint the ship has reached last
            let nextRacePointNumber = 2;
            const one = 1;
            const locationRegistration = yield locationRegistration_1.LocationRegistration.findOne({ eventRegId: registration.eventRegId }, { _id: 0, __v: 0 }, { sort: { 'locationTime': -1 } });
            if (locationRegistration) {
                nextRacePointNumber = locationRegistration.racePointNumber + one;
                if (locationRegistration.finishTime !== null) {
                    const updatedRegistration = registration;
                    updatedRegistration.racePointNumber = locationRegistration.racePointNumber;
                    updatedRegistration.raceScore = locationRegistration.raceScore;
                    updatedRegistration.finishTime = locationRegistration.finishTime;
                    return updatedRegistration;
                }
            }
            if (eventRegistration) {
                const event = yield event_1.Event.findOne({ eventId: eventRegistration.eventId }, { _id: 0, __v: 0 });
                if (event && event.isLive) {
                    // Finds the next racepoint and calculates the ships distance to the racepoint
                    // and calculates the score based on the distance
                    const nextRacePoint = yield racePoint_1.RacePoint.findOne({ eventId: eventRegistration.eventId, racePointNumber: nextRacePointNumber }, { _id: 0, __v: 0 });
                    if (nextRacePoint) {
                        let distance = this.FindDistance(registration, nextRacePoint);
                        if (distance < 25) {
                            if (nextRacePoint.type !== "finishLine") {
                                const newNextRacePoint = yield racePoint_1.RacePoint.findOne({ eventId: eventRegistration.eventId, racePointNumber: nextRacePoint.racePointNumber + one }, { _id: 0, __v: 0 });
                                if (newNextRacePoint) {
                                    const nextPointDistance = this.FindDistance(registration, newNextRacePoint);
                                    distance = nextPointDistance;
                                    const updatedRegistration = registration;
                                    updatedRegistration.racePointNumber = nextRacePointNumber;
                                    updatedRegistration.raceScore = ((nextRacePointNumber) * 10) + ((nextRacePointNumber) / distance);
                                    return updatedRegistration;
                                }
                            }
                            else {
                                const updatedRegistration = registration;
                                updatedRegistration.racePointNumber = nextRacePointNumber;
                                updatedRegistration.finishTime = registration.locationTime;
                                const ticks = ((registration.locationTime.getTime() * 10000) + 621355968000000000);
                                updatedRegistration.raceScore = (1000000000000000000 - ticks) / 1000000000000;
                                return updatedRegistration;
                            }
                        }
                        else {
                            const updatedRegistration = registration;
                            updatedRegistration.racePointNumber = nextRacePointNumber - 1;
                            updatedRegistration.raceScore = ((nextRacePointNumber - 1) * 10) + ((nextRacePointNumber - 1) / distance);
                            return updatedRegistration;
                        }
                    }
                    else {
                        const updatedRegistration = registration;
                        updatedRegistration.racePointNumber = 1;
                        updatedRegistration.raceScore = 0;
                        return updatedRegistration;
                    }
                }
                else {
                    const updatedRegistration = registration;
                    updatedRegistration.racePointNumber = 1;
                    updatedRegistration.raceScore = 0;
                    return updatedRegistration;
                }
            }
        });
    }
}
exports.Validate = Validate;
//# sourceMappingURL=validate.controller.js.map