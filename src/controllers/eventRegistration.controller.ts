const EventRegistration = require('../models/eventRegistration.js');
const Ship = require('../models/ship.js');
const Event = require('../models/event.js');
const User = require('../models/user.js');
const Auth = require('./authentication.controller.js');

let bcrypt = require('bcryptjs');

// Create and Save a new EventRegistration
exports.create = (req, res) => {

    // Checking if authorized
    Auth.Authorize(req, res, "user", function (err) {
        if (err)
            return err;

        // Creating the eventRegistration
        const registration = new EventRegistration(req.body);
        module.exports.createRegistration(registration, res, function (err, registration) {
            if (err)
                return err;

            return res.status(201).json(registration);
        });
    });
};

// Checks that all foreignkeys are valid. Creates and save a new EventRegistration. Returns response
exports.createRegistration = (newRegistration, res, callback) => {

    validateForeignKeys(newRegistration, res, function (err) {
        if (err)
            return callback(err);

        // Finding next eventRegId
        EventRegistration.findOne({}).sort('-eventRegId').exec(function (err, lastEventRegistration) {
            if (err)
                return callback(res.status(500).send({ message: err.message || "Some error occurred while retriving eventRegistrations" }));
            if (lastEventRegistration)
                newRegistration.eventRegId = lastEventRegistration.eventRegId + 1;
            else
                newRegistration.eventRegId = 1;

            newRegistration.save(function (err) {
                if (err)
                    return callback(res.send(err));
                return callback(null, newRegistration);
            });
        });
    })
};

// Retrieve and return all EventRegistrations from the database.
exports.findAll = (req, res) => {

    // Checking if authorized
    Auth.Authorize(req, res, "admin", function (err) {
        if (err)
            return err;

        // Finding all the registrations in the db
        EventRegistration.find({}, { _id: 0, __v: 0 }, function (err, eventRegistrations) {
            if (err)
                return res.status(500).send({ message: err.message || "Some error occurred while retriving EventRegistrations" });

            res.status(200).json(eventRegistrations);
        });
    });
};

// Retrieve all eventRegistrations where the given user is a participant
const pending = 0;
exports.findEventRegFromUsername = (req, res) => {

    // Checking if authorized
    Auth.Authorize(req, res, "user", function (err, decodedUser) {
        if (err)
            return err;

        // Finding ship by emailUsername in the token
        Ship.find({ emailUsername: decodedUser.id }, { _id: 0, __v: 0 }, function (err, ships) {
            if (err)
                return res.status(500).send({ message: "Error retrieving ships" });

            ships.forEach(ship => {
                pending++;
                EventRegistration.find({eventId : req.params.eventId, shipId : ship.shipId }, { _id: 0, __v: 0 }, function (err, eventRegistration) {
                    pending--;
                    if (err)
                        return res.status(500).send({ message: "Error retrieving eventRegistrations " })
                    if (eventRegistration)
                        return res.status(200).send(eventRegistration);
                });
            });
        });
    });
};

// Creating an eventRegistration
exports.signUp = (req, res) => {

    // Checking if authorized
    Auth.Authorize(req, res, "user", function (err) {
        if (err)
            return err;

        // Checks that the eventCode is correct
        Event.findOne({ eventCode: req.body.eventCode }, { _id: 0, __v: 0 }, function (err, event) {
            if (err)
                return res.status(500).send({ message: "error retrieving events" });
            if (!event)
                return res.status(404).send({ message: "Wrong eventCode" });

            if (event) {
                // Checks that the ship isn't already assigned to the event
                EventRegistration.findOne({ shipId: req.body.shipId, eventId: event.eventId }, { _id: 0, __v: 0 }, function (err, eventRegistration) {
                    if (err)
                        return res.status(500).send({ message: "error retreiving eventRegistrations" });

                    if (eventRegistration)
                        return res.status(409).send({ message: "ship already registered to this event" })

                    if (!eventRegistration) {

                        // Creating the eventRegistration
                        const registration = new EventRegistration(req.body);
                        registration.eventId = event.eventId;
                        module.exports.createRegistration(registration, res, function (err, registration) {
                            if (err)
                                return err;

                            return res.status(201).json(registration);
                        });
                    }
                })
            }
        })
    });
}

// Retrieve all participants of the given event
let pending = 0;
exports.getParticipants = (req, res) => {

    const participants = [];
    EventRegistration.find({ eventId: req.params.eventId }, { _id: 0, __v: 0 }, function (err, eventRegs) {
        if (err)
            return res.status(500).send({ message: "Error retrieving participants" });
        if (!eventRegs || eventRegs.length === 0)
            return res.status(404).send({ message: "No participants found" });

        if (eventRegs !== 0) {
            eventRegs.forEach(eventRegistration => {
                pending++;

                Ship.findOne({ shipId: eventRegistration.shipId }, { _id: 0, __v: 0 }, function (err, ship) {
                    if (err)
                        return res.status(500).send({ message: "error retrieving ship" });
                    if (!ship)
                        return res.status(404).send({ message: "Ship not found" });

                    else if (ship) {
                        User.findOne({ emailUsername: ship.emailUsername }, { _id: 0, __v: 0 }, function (err, user) {
                            pending--;
                            if (err)
                                return res.status(500).send({ message: "Error retrieving user" });
                            if (!user)
                                return res.status(404).send({ message: "User not found" });

                            if (user) {
                                participant = {
                                    "firstname": user.firstname,
                                    "lastname": user.lastname,
                                    "shipName": ship.name,
                                    "teamName": eventRegistration.teamName,
                                    "emailUsername": user.emailUsername,
                                    "eventRegId": eventRegistration.eventRegId
                                }
                                participants.push(participant);

                                if (pending === 0) {
                                    return res.status(200).json(participants);
                                }
                            }
                        })
                    }
                })
            });
        }
    })
}

// Creating an eventRegistration
exports.addParticipant = (req, res) => {

    // Checking if authorized
    Auth.Authorize(req, res, "admin", function (err) {
        if (err)
            return err;

        // Creates a user if no user corresponding to the given emailUsername found
        User.findOne({ emailUsername: req.body.emailUsername }, { _id: 0, __v: 0 }, function (err, user) {
            if (err)
                return res.status(500).send({ message: "error retrieving user" });
            if (!user) {

                const hashedPassword = bcrypt.hashSync("1234", 10);
                const newUser = new User({ "emailUsername": req.body.emailUsername, "firstname": req.body.firstname, "lastname": req.body.lastname, "password": hashedPassword, "role": "user" });

                newUser.save(function (err) {
                    if (err)
                        return res.send(err);
                });
            }

            // Creating a ship if a ship with the given name and owned by the given user, doesn't exist
            Ship.findOne({ emailUsername: req.body.emailUsername, name: req.body.shipName }, { _id: 0, __v: 0 }, function (err, ship) {
                if (err)
                    return res.status(500).send({ message: "error retrieving ship" });
                if (!ship) {

                    const newShip = new Ship({ "name": req.body.shipName, "emailUsername":req.body.emailUsername });

                    Ship.findOne({}).sort('-shipId').exec(function (err, lastShip) {
                        if (err)
                            return res.status(500).send({ message: err.message || "Some error occurred while retriving ships" });
                        if (lastShip)
                            newShip.shipId = lastShip.shipId + 1;
                        else
                            newShip.shipId = 1;

                        newShip.save(function (err, savedShip) {
                            if (err)
                                return res.send(err);
                            const newEventRegistration = new EventRegistration({"eventId": req.body.eventId, "shipId": savedShip.shipId, "trackColor": "Yellow", "teamName":req.body.teamName});
                            createRegistration(newEventRegistration, res);
                        });
                    });
                }
                else
               {
                const newEventRegistration = new EventRegistration({"eventId": req.body.eventId, "shipId": ship.shipId, "trackColor": "Yellow", "teamName":req.body.teamName})
                createRegistration(newEventRegistration, res);
                }
            })
        });
    })
}

// Updating information on a given participant
exports.updateParticipant = (req, res) => {

    // Checking if authorized
    Auth.Authorize(req, res, "admin", function (err) {
        if (err)
            return err;

        EventRegistration.findOneAndUpdate({ eventRegId: req.params.eventRegId }, req.body, function (err, eventReg) {
            if (err)
                return res.status(500).send({ message: "Error updating eventRegistration with eventRegId " + req.params.eventRegId });
            if (eventReg) {
                Ship.findOneAndUpdate({ shipId: eventReg.shipId }, req.body, function (err, ship) {
                    if (err)
                        return res.status(500).send({ message: "Error updating ship with shipId " + eventReg.shipId });
                    if (ship) {
                        User.findOneAndUpdate({ emailUsername: ship.emailUsername }, req.body, function (err, user) {
                            if (err)
                                return res.status(500).send({ message: "Error updating user with emailUsername " + ship.emailUsername });
                            if (!user)
                                return res.status(404).send({ message: "User not found with emailUsername " + ship.emailUsername });
                            else
                                return res.status(200).send({ updated: "true" })
                        })
                    }
                    else
                        return res.status(404).send({ message: "Ship not found with shipId " + eventReg.shipId });
                });
            }
            else
                return res.status(404).send({ message: "EventRegistration not found with eventRegId " + req.params.eventRegId });
        })
    });
}

// Delete an eventRegistration with the specified eventRegId
exports.delete = (req, res) => {

    // Checking if authorized
    Auth.Authorize(req, res, "all", function (err) {
        if (err)
            return err;

        // Finding and deleting the registration with the given regId
        EventRegistration.findOneAndDelete({ eventRegId: req.params.eventRegId }, function (err, eventRegistration) {
            if (err)
                return res.status(500).send({ message: "Error deleting eventRegistration with eventRegId " + req.params.eventRegId });
            if (!eventRegistration)
                return res.status(404).send({ message: "EventRegistration not found with eventRegId " + req.params.eventRegId });
            res.status(202).json(eventRegistration);
        });
    });
};

// Validator for all eventRegistrations foreignkeys
function validateForeignKeys(registration, res, callback) {
    // Checking if ship exists
    Ship.findOne({ shipId: registration.shipId }, function (err, ship) {
        if (err)
            return callback(res.status(500).send({ message: err.message || "Some error occurred while retriving ships" }));
        if (!ship)
            return callback(res.status(404).send({ message: "Ship with id " + registration.shipId + " was not found" }));

        // Checking if event exists
        Event.findOne({ eventId: registration.eventId }, function (err, event) {
            if (err)
                return callback(res.status(500).send({ message: err.message || "Some error occurred while retriving races" }));
            if (!event)
                return callback(res.status(404).send({ message: "Race with id " + registration.eventId + " was not found" }));

            return callback();
        });
    });
}