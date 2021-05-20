const LocationRegistration = require('../models/locationRegistration.js');
const EventRegistration = require('../models/eventRegistration.js')
const Ship = require('../models/ship.js');
const User = require('../models/user.js');
const Event = require('../models/event.js');
const RacePoint = require('../models/racePoint.js');
const Auth = require('./authentication.controller.js');


// Create and Save a new locationRegistration
exports.create = (req, res) => {

    // Checking if authorized
    Auth.Authorize(req, res, "user", function (err) {
        if (err)
            return err;

        // Creating the LocationRegistration
        const locationRegistration = new LocationRegistration(req.body);
        module.exports.createLocationRegistration(locationRegistration, res, function (err, locationReg) {
            if (err)
                return err;

            return res.status(201).json(locationReg);
        });
    });
};

// Checks that all foreignkeys are valid. Creates and save a new LocationRegistration. Returns response
exports.createLocationRegistration = (newLocationRegistration, res, callback) => {
    validateForeignKeys(newLocationRegistration, res, function (err) {
        if (err)
            return callback(err);

        // Finding next regId
        newLocationRegistration.locationTime.setHours(newLocationRegistration.locationTime.getHours()+2);
        CheckRacePoint(newLocationRegistration, res, function (updatedRegistration) {
            if (updatedRegistration) {
                newLocationRegistration = updatedRegistration


                LocationRegistration.findOne({}).sort('-regId').exec(function (err, lastRegistration) {
                    if (err)
                        return callback(res.status(500).send({ message: err.message || "Some error occurred while retriving locationRegistrations" }));
                    if (lastRegistration)
                        newLocationRegistration.regId = lastRegistration.regId + 1;
                    else
                        newLocationRegistration.regId = 1;

                    newLocationRegistration.save(function (err) {
                        if (err)
                            return callback(res.send(err));
                        return callback(null, newLocationRegistration);
                    });
                });
            }
        });
    })
};

// Updates racePoint number, if the ship has reached new racePoint and calculates the racescore
function CheckRacePoint(registration, res, callback) {
    EventRegistration.findOne({ eventRegId: registration.eventRegId }, { _id: 0, __v: 0 }, function (err, eventRegistration) {
        if (err)
            return callback(res.status(500).send({ message: err.message || "Some error occurred while retriving eventRegistrations" }));

        // Checks which racepoint the ship has reached last
        let nextRacePointNumber = 2;
        LocationRegistration.findOne({ eventRegId: registration.eventRegId }, { _id: 0, __v: 0 }, { sort: { 'locationTime': -1 } }, function (err, locationRegistration) {
            if (err)
                return callback(res.status(500).send({ message: err.message || "Some error occurred while retriving locationRegistrations" }));

            if (locationRegistration) {
                nextRacePointNumber = locationRegistration.racePointNumber + 1;
                if (locationRegistration.finishTime != null) {
                    const updatedRegistration = registration;
                    updatedRegistration.racePointNumber = locationRegistration.racePointNumber;
                    updatedRegistration.raceScore = locationRegistration.raceScore;
                    updatedRegistration.finishTime = locationRegistration.finishTime;
                    return callback(updatedRegistration)
                }
            }

            if (eventRegistration) {
                Event.findOne({ eventId: eventRegistration.eventId }, { _id: 0, __v: 0 }, function (err, event) {
                    if (err)
                        return callback(res.status(500).send({ message: err.message || "Some error occurred while retriving events" }));

                    if (event && event.isLive) {

                        // Finds the next racepoint and calculates the ships distance to the racepoint
                        // and calculates the score based on the distance
                        RacePoint.findOne({ eventId: eventRegistration.eventId, racePointNumber: nextRacePointNumber }, { _id: 0, __v: 0 }, function (err, nextRacePoint) {
                            if (err)
                                return callback(res.status(500).send({ message: err.message || "Some error occurred while retriving racepoints" }));
                            if (nextRacePoint) {
                                FindDistance(registration, nextRacePoint, function (distance) {
                                    if (distance < 25) {

                                        if (nextRacePoint.type != "finishLine") {
                                            RacePoint.findOne({ eventId: eventRegistration.eventId, racePointNumber: nextRacePoint.racePointNumber + 1 }, { _id: 0, __v: 0 }, function (err, newNextRacePoint) {
                                                if (err)
                                                    return callback(res.status(500).send({ message: err.message || "Some error occurred while retriving racepoints" }));


                                                if (newNextRacePoint) {
                                                    FindDistance(registration, newNextRacePoint, function (nextPointDistance) {
                                                        distance = nextPointDistance;

                                                        const updatedRegistration = registration;
                                                        updatedRegistration.racePointNumber = nextRacePointNumber;
                                                        updatedRegistration.raceScore = ((nextRacePointNumber) * 10) + ((nextRacePointNumber) / distance);
                                                        return callback(updatedRegistration)
                                                    });
                                                }

                                            })
                                        } else {
                                            const updatedRegistration = registration;
                                            updatedRegistration.racePointNumber = nextRacePointNumber;
                                            updatedRegistration.finishTime = registration.locationTime
                                            const ticks = ((registration.locationTime.getTime() * 10000) + 621355968000000000);
                                            updatedRegistration.raceScore = (1000000000000000000 - ticks) / 1000000000000
                                            return callback(updatedRegistration);
                                        }
                                    } else {
                                        const updatedRegistration = registration;
                                        updatedRegistration.racePointNumber = nextRacePointNumber - 1;
                                        updatedRegistration.raceScore = ((nextRacePointNumber - 1) * 10) + ((nextRacePointNumber - 1) / distance);
                                        return callback(updatedRegistration)
                                    }
                                });
                            } else {
                                const updatedRegistration = registration;
                                updatedRegistration.racePointNumber = 1;
                                updatedRegistration.raceScore = 0;
                                return callback(updatedRegistration)
                            }
                        });
                    } else {
                        const updatedRegistration = registration;
                        updatedRegistration.racePointNumber = 1;
                        updatedRegistration.raceScore = 0;
                        return callback(updatedRegistration)
                    }
                });
            }
        });
    });
}

// Finds the ships distance to the racepoint
function FindDistance(registration, racePoint, callback) {
    const checkPoint1 = {};
    const checkPoint2 = {};

    checkPoint1.longtitude = racePoint.firstLongtitude;
    checkPoint1.latitude = racePoint.firstLatitude;
    checkPoint2.longtitude = racePoint.secondLongtitude;
    checkPoint2.latitude = racePoint.secondLatitude;

    const AB = CalculateDistance(checkPoint1, checkPoint2);
    const BC = CalculateDistance(checkPoint2, registration);
    const AC = CalculateDistance(checkPoint1, registration);

    const P = (AB + BC + AC) / 2;
    const S = Math.sqrt(P * (P - AC) * (P - AB) * (P - AC));

    const result = 2 * S / AB;
    return callback(result)
}

// Calculates the closets distance from the ship to the checkpoint
function CalculateDistance(first, second) {
    const R = 6371e3; // metres
    const φ1 = first.latitude * Math.PI / 180; // φ, λ in radians
    const φ2 = second.latitude * Math.PI / 180;
    const Δφ = (second.latitude - first.latitude) * Math.PI / 180;
    const Δλ = (second.longtitude - first.longtitude) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c;

    return d;
}

// Retrieve the latest locationRegistrations on all ships in specific event
let pending = 0
exports.getLive = (req, res) => {
    EventRegistration.find({ eventId: req.params.eventId }, { _id: 0, __v: 0 }, function (err, eventRegistrations) {
        if (err) {
            return res.status(500).send({ message: err.message || "Some error occurred while retriving eventRegistrations" });
        }

        const fewRegistrations = [];
        eventRegistrations.forEach(eventRegistration => {
            pending++

            LocationRegistration.find({ eventRegId: eventRegistration.eventRegId }, { _id: 0, __v: 0 }, { sort: { 'locationTime': -1 }, limit: 20 }, function (err, locationRegistration) {
                pending--;
                if (err) {
                    return res.status(500).send({ message: err.message || "Some error occurred while retriving locationRegistrations" });
                }
                if (locationRegistration.length != 0) {
                    boatLocations = { "locationsRegistrations": locationRegistration, "color": eventRegistration.trackColor, "shipId": eventRegistration.shipId, "teamName": eventRegistration.teamName }
                    fewRegistrations.push(boatLocations);

                }
                if (pending == 0) {
                    if (fewRegistrations.length != 0) {
                        if (fewRegistrations[0].locationsRegistrations[0].raceScore != 0) {
                            fewRegistrations.sort((a, b) => (a.locationsRegistrations[0].raceScore >= b.locationsRegistrations[0].raceScore) ? -1 : 1)

                            for (i = 0; i < fewRegistrations.length; i++) {
                                fewRegistrations[i].placement = i + 1;
                            }
                        } else {
                            fewRegistrations.sort((a, b) => (a.shipId > b.shipId) ? 1 : -1)

                        }
                    }
                    return res.status(200).json(fewRegistrations);
                }
            });
        });
    });
};

// Retrive scoreboard from event
exports.getScoreboard = (req, res) => {
    let pending = 0;
    EventRegistration.find({ eventId: req.params.eventId }, { _id: 0, __v: 0 }, function (err, eventRegistrations) {
        if (err)
            return res.status(500).send({ message: err.message || "Some error occurred while retriving eventRegistrations" })
        if (eventRegistrations.length !== 0) {
            const scores = [];
            eventRegistrations.forEach(eventReg => {
                pending++;
                LocationRegistration.find({ eventRegId: eventReg.eventRegId }, { _id: 0, __v: 0 }, { sort: { 'locationTime': -1 }, limit: 1 }, function (err, locationRegistration) {
                    if (err)
                        return res.status(500).send({ message: err.message || "Some error occurred while retriving locationRegistrations" });
                    if (locationRegistration.length !== 0) {
                        Ship.findOne({ shipId: eventReg.shipId }, { _id: 0, __v: 0 }, function (err, ship) {
                            if (err)
                                return res.status(500).send({ message: err.message || "Some error occurred while retriving ships" });

                            User.findOne({ emailUsername: ship.emailUsername }, { _id: 0, __v: 0 }, function (err, user) {
                                pending--;
                                if (err)
                                    return res.status(500).send({ message: err.message || "Some error occurred while retriving users" });
                                if (user) {
                                    score = { "locationsRegistrations": locationRegistration, "color": eventReg.trackColor, "shipId": eventReg.shipId, "shipName": ship.name, "teamName": eventReg.teamName, "owner": user.firstname + " " + user.lastname };
                                    scores.push(score);
                                }
                                if (pending === 0) {
                                    if (scores.length != 0) {
                                        if (scores[0].locationsRegistrations[0].raceScore != 0) {
                                            scores.sort((a, b) => (a.locationsRegistrations[0].raceScore >= b.locationsRegistrations[0].raceScore) ? -1 : 1)

                                            for (i = 0; i < scores.length; i++) {
                                                scores[i].placement = i + 1;
                                            }
                                        }
                                        else {
                                            scores.sort((a, b) => (a.shipId > b.shipId) ? 1 : -1)
                                        }
                                    }
                                    return res.status(200).json(scores);
                                }
                            });
                        })
                    }
                    else
                        pending--;
                })
            })
            if (pending === 0)
                return res.status(200).send(scores);
        }
        else
            return res.status(200).send({});
    })
}


// Retrieve all locationRegistrations from an event
exports.getReplay = (req, res) => {
    EventRegistration.find({ eventId: req.params.eventId }, { _id: 0, __v: 0 }, function (err, eventRegistrations) {
        if (err) {
            return res.status(500).send({ message: err.message || "Some error occurred while retriving eventRegistrations" })
        }

        if (eventRegistrations.length !== 0) {
            const shipLocations = [];
            eventRegistrations.forEach(eventRegistration => {
                pending++
                LocationRegistration.find({ eventRegId: eventRegistration.eventRegId }, { _id: 0, __v: 0 }, { sort: { 'locationTime': 1 } }, function (err, locationRegistrations) {
                    pending--
                    if (err)
                        return res.status(500).send({ message: err.message || "Some error occurred while retriving registrations" })
                    if (locationRegistrations) {
                        const shipLocation = { "locationsRegistrations": locationRegistrations, "color": eventRegistration.trackColor, "shipId": eventRegistration.shipId, "teamName": eventRegistration.teamName }
                        shipLocations.push(shipLocation)
                    }
                    if (pending === 0) {
                        return res.status(200).send(shipLocations)
                    }
                });
            });
        } else {
            return res.status(200).send({})
        }
    });
};

// Deleting all locationRegistration with an given eventRegId
exports.deleteFromEventRegId = (req, res) => {

    // Checking if authorized
    Auth.Authorize(req, res, "user", function (err) {
        if (err)
            return err;

        // Finding and deleting the locationRegistrations with the given eventRegId
        LocationRegistration.deleteMany({ eventRegId: req.params.eventId }, function (err, locationRegistrations) {
            if (err)
                return res.status(500).send({ message: "Error deleting locationRegistrations with eventRegId " + req.params.regId });
            if (!locationRegistrations)
                return res.status(404).send({ message: "LocationRegistrations not found with eventRegId " + req.params.regId });

            res.status(202).json(locationRegistrations);
        });
    });
};

function validateForeignKeys(registration, res, callback) {

    // Checking if eventReg exists
    EventRegistration.findOne({ eventRegId: registration.eventRegId }, function (err, eventReg) {
        if (err)
            return callback(res.status(500).send({ message: err.message || "Some error occurred while retriving event eventRegistration" }));
        if (!eventReg)
            return callback(res.status(404).send({ message: "EventRegistration with id " + registration.eventRegId + " was not found" }));

        return callback();
    });
}