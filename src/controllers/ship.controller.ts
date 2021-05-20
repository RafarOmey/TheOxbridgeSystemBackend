const Ship = require('../models/ship.js');
const EventRegistrations = require('../models/eventRegistration.js');
const Auth = require('./authentication.controller.js');

// Create and Save a new ship
exports.create = (req, res) => {

    // Checking if authorized
    Auth.Authorize(req, res, "user", function (err) {
        if (err)
            return err;

        const ship = new Ship(req.body);

        // Finding next shipId
        Ship.findOne({}).sort('-shipId').exec(function (err, lastShip) {
            if (err)
                return res.status(500).send({ message: err.message || "Some error occurred while retriving ships" });
            if (lastShip)
                ship.shipId = lastShip.shipId + 1;
            else
                ship.shipId = 1;

            // Saving the new ship in the DB
            ship.save(function (err) {
                if (err)
                    return res.send(err);
                res.status(201).json(ship);
            });
        });
    });
};

// Retrieving all user ships
exports.findMyShips = (req, res) => {

    // Checking if authorized
    Auth.Authorize(req, res, "all", function (err, decodedUser) {
        if (err)
            return err;

        Ship.find({ emailUsername: decodedUser.id }, { _id: 0, __v: 0 }, function (err, ships) {
            if (err)
                return res.status(500).send({ message: err.message || "Some error occurred while retriving ships" });

            res.status(200).send(ships);
        });
    });
}

// Retrieve and return all ships
exports.findAll = (req, res) => {

    // Checking if authorized
    Auth.Authorize(req, res, "all", function (err) {
        if (err)
            return err;

        // Finding all ships in the db
        Ship.find({}, { _id: 0, __v: 0 }, function (err, ships) {
            if (err)
                return res.status(500).send({ message: err.message || "Some error occurred while retriving ships" });

            res.status(200).json(ships);
        });
    });
};

// Find a single ship with the given shipId
exports.findOne = (req, res) => {
    Ship.findOne({ shipId: req.params.shipId }, { _id: 0, __v: 0 }, function (err, ship) {
        if (err)
            return res.status(500).send({ message: "Error retrieving ship with shipId " + req.params.shipId });
        if (!ship)
            return res.status(404).send({ message: "Ship with id " + req.params.shipId + " was not found" });

        res.status(200).send({ "name": ship.name, "shipId": ship.shipId});
    });
};

// Find all ships registered to an specific event
let pending = 0
exports.findFromEventId = (req, res) => {
    EventRegistrations.find({ eventId: req.params.eventId }, { _id: 0, __v: 0 }, function (err, eventRegistrations) {
        if (err) {
            return res.status(500).send({ message: err.message || "Some error occurred while retriving bikeRacks" });
        }
        if (eventRegistrations.length != 0) {

            const ships = [];
            eventRegistrations.forEach(eventRegistration => {
                pending++;

                Ship.findOne({ shipId: eventRegistration.shipId }, { _id: 0, __v: 0 }, function (err, ship) {
                    pending--
                    if (err) {
                        return res.status(500).send({ message: err.message || "Some error occurred while retriving bikeRacks" });
                    }
                    if (ship) {
                        ships.push({ "shipId": ship.shipId, "name": ship.name, "teamName": eventRegistration.teamName });
                    }
                    if (pending === 0) {
                        res.status(200).json(ships);
                    }
                });
            });
        } else {
            res.status(200).json({});
        }
    });
};


// Update a ship identified by the shipId
exports.update = (req, res) => {

    // Checking if authorized
    Auth.Authorize(req, res, "admin", function (err) {
        if (err)
            return err;

        // Finding and updating the ship with the given shipId
        const newShip = new Ship(req.body);
        Ship.findOneAndUpdate({ shipId: req.params.shipId }, newShip, function (err, ship) {
            if (err)
                return res.status(500).send({ message: "Error updating ship with shipId " + req.params.shipId });
            if (!ship)
                return res.status(404).send({ message: "Ship not found with shipId " + req.params.shipId });

            res.status(202).json(ship);
        });
    })
};

// Delete a ship with the specified shipId in the request
exports.delete = (req, res) => {

    // Checking if authorized
    Auth.Authorize(req, res, "all", function (err) {
        if (err)
            return err;

        // Finding and deleting the ship with the given shipId
        Ship.findOneAndDelete({ shipId: req.params.shipId }, function (err, ship) {
            if (err)
                return res.status(500).send({ message: "Error deleting ship with shipId " + req.params.shipId });
            if (!ship)
                return res.status(404).send({ message: "Ship not found with shipId " + req.params.shipId });

            res.status(202).json(ship);
        });
    });
};