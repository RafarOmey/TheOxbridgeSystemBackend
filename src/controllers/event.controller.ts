import {Event} from '../models/event';
import {EventRegistration} from '../models/eventRegistration';
import {Ship} from '../models/ship';
import {Authorize} from './authentication.controller';
import {RacePoint} from '../models/racePoint';
import {Request,Response} from 'express';

// Create and Save a new Event
exports.create = (req: Request, res:Response): void => {

    // Checking if authorized
    Auth.Authorize(req, res, "admin", function (err) {
        if (err)
            return err;

        const event = new Event(req.body);

        // Finding next eventId
        Event.findOne({}).sort('-eventId').exec(function (err, lastEvent) {
            if (err)
                return res.status(500).send({ message: err.message || "Some error occurred while retriving events" });
            if (lastEvent)
                event.eventId = lastEvent.eventId + 1;
            else
                event.eventId = 1;

            // Saving the new Event in the DB
            event.save(function (err) {
                if (err)
                    return res.send(err);
                res.status(201).json(event);
            });
        });
    });
};

// Checking if event has a route
exports.hasRoute = (req:Request, res:Response) => {
    RacePoint.find({eventId: req.params.eventId}, {_id:0, __v:0}, function(err, racepoints){
        if(err)
            return res.status(500).send({message: "false"});
        if(racepoints && racepoints.length !== 0)
            return res.status(200).send(true);
        else
            return res.status(200).send(false);
    })
}

// Retrieve and return all events from the database.
exports.findAll = (req:Request, res:Response) => {
    Event.find({}, { _id: 0, __v: 0 }, function (err, events) {
        if (err)
            return res.status(500).send({ message: err.message || "Some error occurred while retriving events" });

        res.status(200).json(events);
    });
};

// Get all events that the user is a participant of
let pending = 0;
exports.findFromUsername = (req:Request, res:Response) => {

    // Checking if authorized
    Auth.Authorize(req, res, "all", function (err, decodedUser) {
        if (err)
            return err;

        // Finding all the ships the user owns
        const events:Event[] = new Array;
        Ship.find({ emailUsername: decodedUser.id }, { _id: 0, __v: 0 }, function (err, ships) {
            if (err)
                return res.status(500).send({ message: err.message || "Some error occurred while retriving ships" });

            if (ships.length > 0) {
                // Finding all eventRegistrations with a ship that the user owns
                ships.forEach(ship => {
                    EventRegistration.find({ shipId: ship.shipId }, { _id: 0, __v: 0 }, function (err, eventRegistrations) {
                        if (err)
                            return res.status(500).send({ message: err.message || "Some error occurred while retriving eventRegistrations" });

                        if (eventRegistrations) {
                            eventRegistrations.forEach(eventRegistration => {
                                pending++;
                                Ship.findOne({ shipId: eventRegistration.shipId }, { _id: 0, __v: 0 }, function (err, ship) {
                                    if (err)
                                        return res.status(500).send({ message: err.message || "Some error occurred while retriving the ship" });

                                    if (ship) {
                                        Event.findOne({ eventId: eventRegistration.eventId }, { _id: 0, __v: 0 }, function (err, event) {
                                            pending--
                                            if (err)
                                                return res.status(500).send({ message: err.message || "Some error occurred while retriving the event" });

                                            if (event) {
                                                events.push({ "eventId": event.eventId, "name": event.name, "eventStart": event.eventStart, "eventEnd": event.eventEnd, "city": event.city, "eventRegId": eventRegistration.eventRegId, "shipName": ship.name, "teamName": eventRegistration.teamName, "isLive" : event.isLive, "actualEventStart": event.actualEventStart });
                                            }
                                            if (pending == 0) {
                                                res.status(200).send(events);
                                            }
                                        });
                                    }
                                });
                            });
                        }
                    });
                });
            } else {
                res.status(200).send(events);
            }
        });
    });
};

// Find a single event with the given eventId
exports.findOne = (req:Request, res:Response) => {
    Event.findOne({ eventId: req.params.eventId }, { _id: 0, __v: 0 }, function (err, event) {
        if (err)
            return res.status(500).send({ message: "Error retrieving event with eventId " + req.params.eventId });
        if (!event)
            return res.status(404).send({ message: "Event not found with eventId " + req.params.eventId });

        res.status(200).send(event);
    });
};

// Finding and updating event with the given eventId
exports.update = (req:Request, res:Response) => {

    // Checking if authorized
    Auth.Authorize(req, res, "admin", function (err) {
        if (err)
            return err;

        const newEvent = req.body;
        newEvent.eventId = req.params.eventId;
        Event.updateOne({ eventId: req.params.eventId }, newEvent, function (err, event) {
            if (err)
                return res.status(500).send({ message: err.message || "Error updating bikeRackStation with stationId " + req.params.eventId });
            if (!event)
                return res.status(404).send({ message: "BikeRackStation not found with stationId " + req.params.eventId });
            res.status(202).json(newEvent);
        });
    });
};

// Changes event property "isLive" to true
exports.StartEvent = (req:Request, res:Response) => {

    // Checking if authorized
    Auth.Authorize(req, res, "admin", function (err) {
        if (err)
            return err;

        const updatedEvent = {isLive : true, actualEventStart : req.body.actualEventStart}
        Event.findOneAndUpdate({ eventId : req.params.eventId }, updatedEvent, {new : true}, function (err, event) {
            if (err)
                return res.status(500).send({ message: "Error updating event with eventId " + req.params.eventId });
            if (!event)
                return res.status(404).send({ message: "Event not found with eventId " + req.params.eventId });

            res.status(202).json(event);
        });
    });
};

// Changes event property "isLive" to false
exports.StopEvent = (req:Request, res:Response) => {

    // Checking if authorized
    Auth.Authorize(req, res, "admin", function(err){
        if(err)
            return err;

        Event.findOneAndUpdate({eventId: req.params.eventId }, {isLive: false}, {new : true}, function(err, event){
            if(err)
                return res.status(500).send({ message: "Error updating event with eventId " + req.params.eventId });
            if (!event)
                return res.status(404).send({ message: "Event not found with eventId " + req.params.eventId });
            else
                res.status(202).json(event);
        })
    })
}

// Delete an event with the specified eventId in the request
exports.delete = (req:Request, res:Response) => {

    // Checking if authorized
    Auth.Authorize(req, res, "admin", function (err) {
        if (err)
            return err;

        // Finding and the deleting the event with the given eventId
        Event.findOneAndDelete({ eventId: req.params.eventId }, function (err, event) {
            if (err)
                return res.status(500).send({ message: "Error deleting event with eventId " + req.params.eventId });
            if (!event)
                return res.status(404).send({ message: "Event not found with eventId " + req.params.eventId });

            // Finding and deleting every EventRegistration with the given eventId
            EventRegistration.deleteMany({eventId: req.params.eventId}, {_id:0,__v:0}, function(err, eventRegs){
                if(err)
                    return res.status(500).send({ message: "Error deleting eventRegistration with eventId " + req.params.eventId });

                // Finding and deleting every RacePoint with the given eventId
                RacePoint.deleteMany({eventId: req.params.eventId}, {_id:0, __v:0}, function(err, racepoints){
                    if(err)
                        return res.status(500).send({ message: "Error deleting RacePoints with eventId " + req.params.eventId });

                    res.status(202).json(event);
                })
            })
        });
    });
};