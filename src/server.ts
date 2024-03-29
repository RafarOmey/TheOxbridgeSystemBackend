import { connect } from "mongoose";
import express from 'express';
import cors from 'cors';
import * as mongoose from 'mongoose';
import * as bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { Event, IEvent } from "./models/event";
import { Auth } from './controllers/authentication.controller';
import { EventRegistration, IEventRegistration } from './models/eventRegistration';
import { RacePoint, IRacePoint } from './models/racePoint';
import { AccessToken } from "./controllers/accessToken.controller";
import { Ship, IShip } from './models/ship'
import { IUser, User } from "./models/user";
import { ILocationRegistration, LocationRegistration } from "./models/locationRegistration";
import bcrypt from 'bcrypt-nodejs';
import * as jwt from 'jsonwebtoken';
import cookieParser from "cookie-parser";
import { Validate } from "./controllers/validate.controller";
import { Broadcast, IBroadcast } from "./models/broadcast";
import nodemailer from 'nodemailer';
import date from 'date-and-time';
import generator from 'generate-password';
import multer from 'multer';
import { IImage, Image } from './models/image';
import fs from 'fs';
import fsExtra from 'fs-extra';


dotenv.config({ path: 'config/config.env' });


const app = express();

app.use(cookieParser(process.env.TOKEN_SECRET));
app.use(cors());

const urlencode = bodyParser.urlencoded({ extended: true });
app.use(express.static('public'));
app.use(bodyParser.json());

connect(process.env.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});


// ROUTING
const router = express.Router();

// TO PROCESS THE NEXT REQUEST !!
router.use((req, res, next) => {
    console.log("recieved a request now, ready for the next");
    next();
});


const storage = multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});

const upload = multer({ storage });

// Checks the time to see if it is 3 days before an event
const checkTime = async (): Promise<boolean> => {
    const now = new Date();
    const currentTime = date.format(now, 'YYYY/MM/DD HH');
    console.log(currentTime);

    const events: IEvent[] = await Event.find({});

    // Checks through all events
    events.forEach(async (event: IEvent) => {
        const threeDaysBefore = date.addDays(event.eventStart, -3);
        const minusHours = date.addHours(threeDaysBefore, -2);
        const eventDate = date.format(minusHours, 'YYYY/MM/DD HH');
        console.log(eventDate);

        // checks if eventdate -3days is equals to currenttime
        if (eventDate === currentTime) {

            // Finds all participants in an event and sends an email to them
            const eventRegs: IEventRegistration[] = await EventRegistration.find({ eventId: event.eventId });
            eventRegs.forEach(async (eventReg: IEventRegistration) => {
                const ship: IShip = await Ship.findOne({ shipId: eventReg.shipId });

                // Transporter object using SMTP transport
                const transporter = nodemailer.createTransport({
                    host: "smtp.office365.com",
                    port: 587,
                    secure: false, // true for 465, false for other ports
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PSW,
                    },
                });

                // sending mail with defined transport object
                const info = await transporter.sendMail({
                    from: '"Tregatta" <*INSERT EMAIL*>', // sender address
                    to: ship.emailUsername, //
                    subject: "Event in 3 days!", // subject line
                    text: "this is your reminder that in 3 days, " + event.name + " will start, which you are participating in. good luck!", // text body
                    // html: "<p> some html </p>" // html in the body
                });
                console.log('DONE');

            });
            return true;
        }

    });
    return false;



}

// Calls the checkTime function every hour
setInterval(checkTime, 3600000);

app.use('/', router);
// Retrieve all events
app.get('/events', async (req, res) => {
    try {
        const events: IEvent[] = await Event.find({}, { _id: 0, __v: 0 });
        res.status(200).json(events);
    } catch (e) {
        res.status(400).send('BAD REQUEST')
    }
});
// Create an new event
app.post('/events', async (req, res) => {
    try {
        const verify: boolean = await Auth.Authorize(req, res, "admin");
        if (!verify) {
            return res.status(400).send({ auth: false, message: 'Not Authorized' });
        }
        const event = new Event(req.body);
        const one: any = 1;
        const lastEvent: IEvent = await Event.findOne({}, {}, {});

        if (lastEvent) {
            event.eventId = lastEvent.eventId + one;
        }
        else {
            event.eventId = 1;
        }


        // Saving the new Event in the DB
        await event.save();
        res.status(201).json(event);



    } catch (e) {
        res.status(400).send('BAD REQUEST')
    }
});
// Retrieve a single Event with eventId
app.get('/events/:eventId', async (req, res) => {
    try {
        const evId: any = req.params.eventId;
        const event: IEvent = await Event.findOne({ eventId: evId }, { _id: 0, __v: 0 });

        if (!event) {
            res.status(400).send('Event not found');
        }
        else {
            res.status(200).send(event);
        }
    } catch (e) {
        res.status(400).send('BAD REQUEST');
    }
});

// Update an Event with given eventId
app.put('/events/:eventId', async (req, res) => {
    try {
        const verify: boolean = await Auth.Authorize(req, res, "admin");
        if (!verify) {
            return res.status(400).send({ auth: false, message: 'Not Authorized' });
        }
        const newEvent: any = req.body;
        const evId: any = req.params.eventId;
        newEvent.eventId = req.params.eventId;
        Event.updateOne({ eventId: evId }, newEvent);
        res.status(202).json(newEvent);
    } catch (e) {
        res.status(400).send('BAD REQUEST');
    }



});

// Delete an Event with given eventId
app.delete('/events/:eventId', async (req, res) => {
    try {
        // Checking if authorized
        const verify: boolean = await Auth.Authorize(req, res, "admin");
        if (!verify) {
            return res.status(400).send({ auth: false, message: 'Not Authorized' });
        }
        const evId: any = req.params.eventId;
        // Finding and the deleting the event with the given eventId
        Event.findOneAndDelete({ eventId: evId });
        // Finding and deleting every EventRegistration with the given eventId
        EventRegistration.deleteMany({ eventId: evId });
        // Finding and deleting every RacePoint with the given eventId
        RacePoint.deleteMany({ eventId: evId });
        res.status(202).send('Event deleted');





    } catch (e) {
        res.status(400).send('BAD REQUEST')
    }
});

// Updating event property "isLive" to true
app.put('/events/startEvent/:eventId', async (req, res) => {
    try {
        // Checking if authorized
        const verify: boolean = await Auth.Authorize(req, res, "admin");
        if (!verify) {
            return res.status(400).send({ auth: false, message: 'Not Authorized' });
        }
        const evId: any = req.params.eventId;
        const updatedEvent = { isLive: true, actualEventStart: req.body.actualEventStart }
        Event.findOneAndUpdate({ eventId: evId }, updatedEvent, { new: true });
        res.status(202).send('Event is now Live');


    } catch (e) {
        res.status(400).send('BAD REQUEST')
    }
});

// Updating event property "isLive" to false
app.get('/events/stopEvent/:eventId', async (req, res) => {
    try {
        // Checking if authorized
        const verify: boolean = await Auth.Authorize(req, res, "admin");
        if (!verify) {
            return res.status(400).send({ auth: false, message: 'Not Authorized' });
        }
        const evId: any = req.params.eventId;
        Event.findOneAndUpdate({ eventId: evId }, { isLive: false }, { new: true });
        res.status(202).send('Event Stopped');
    } catch (e) {
        res.status(400).send('BAD REQUEST')
    }
});

// Checks if event with given eventId has a route
app.get('/events/hasRoute/:eventId', async (req, res) => {
    try {
        const evId: any = req.params.eventId;
        const racepoints: IRacePoint[] = await RacePoint.find({ eventId: evId }, { _id: 0, __v: 0 });
        if (racepoints && racepoints.length !== 0)
            return res.status(200).send(true);
        else
            return res.status(200).send(false);

    } catch (e) {
        res.status(400).send('BAD REQUEST')
    }
});

// Retrieve all events with participant corresponding to primarykey of user, supplied from the token
app.get('/events/myEvents/findFromUsername', async (req, res) => {
    try {
        // Checking if authorized
        const verify: boolean = await Auth.Authorize(req, res, "admin");
        if (!verify) {
            return res.status(400).send({ auth: false, message: 'Not Authorized' });
        }
        // Finding all the ships the user owns
        const events: any[] = [];
        const token: any = req.header('x-access-token');
        const user: any = AccessToken.getUser(token);
        const ships: IShip[] = await Ship.find({ emailUsername: user.id }, { _id: 0, __v: 0 });


        if (ships.length > 0) {
            // Finding all eventRegistrations with a ship that the user owns
            ships.forEach(async (ship: IShip) => {
                const eventRegistrations: IEventRegistration[] = await EventRegistration.find({ shipId: ship.shipId }, { _id: 0, __v: 0 });
                if (eventRegistrations) {
                    eventRegistrations.forEach(async (eventRegistration: IEventRegistration) => {

                        ship = await Ship.findOne({ shipId: eventRegistration.shipId }, { _id: 0, __v: 0 });
                        if (ship) {
                            const event: IEvent = await Event.findOne({ eventId: eventRegistration.eventId }, { _id: 0, __v: 0 });

                            if (event) {
                                events.push({ "eventId": event.eventId, "name": event.name, "eventStart": event.eventStart, "eventEnd": event.eventEnd, "city": event.city, "eventRegId": eventRegistration.eventRegId, "shipName": ship.name, "teamName": eventRegistration.teamName, "isLive": event.isLive, "actualEventStart": event.actualEventStart });
                            }

                        }
                    });
                }
            });
        }
        res.status(200).send(events);

    } catch (e) {
        res.status(400).send('BAD REQUEST')
    }
});

// Create a new ship
app.post('/ships', async (req, res) => {
    try {
        // Checking if authorized
        const verify: boolean = await Auth.Authorize(req, res, "user");
        if (!verify) {
            return res.status(400).send({ auth: false, message: 'Not Authorized' });
        }
        const ship = new Ship(req.body);

        // Finding next shipId
        const lastShip: IShip = await Ship.findOne({}, {}, { sort: { shipId: -1 } });
        if (lastShip) {
            ship.shipId = lastShip.shipId + 1;
        }
        else {
            ship.shipId = 1;
        }

        // Saving the new ship in the DB
        await ship.save()

        res.status(201).json(ship);



    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }

});

// Retrieve all ships
app.get('/ships', async (req, res) => {
    try {

        // Finding all ships in the db
        const ships: IShip[] = await Ship.find({}, { _id: 0, __v: 0 });
        res.status(200).json(ships);

    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// Retrieve a single ship
app.get('/ships/:shipId', async (req, res) => {
    try {
        const sId: any = req.params.shipId;
        const ship: IShip = await Ship.findOne({ shipId: sId }, { _id: 0, __v: 0 });
        if (!ship)
            return res.status(404).send({ message: "Ship with id " + req.params.shipId + " was not found" });

        res.status(200).send({ "name": ship.name, "shipId": ship.shipId });


    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// Retrieve all ships participating in the given event
app.get('/ships/fromEventId/:eventId', async (req, res) => {
    try {
        const evId: any = req.params.eventId;
        const ships: any[] = [];
        const eventRegistrations: IEventRegistration[] = await EventRegistration.find({ eventId: evId }, { _id: 0, __v: 0 });
        if (eventRegistrations.length !== 0) {

            eventRegistrations.forEach(async (eventRegistration: IEventRegistration) => {

                const ship: IShip = await Ship.findOne({ shipId: eventRegistration.shipId }, { _id: 0, __v: 0 });
                if (ship) {
                    ships.push({ "shipId": ship.shipId, "name": ship.name, "teamName": eventRegistration.teamName });
                }

            });
        }

        res.status(200).json(ships);

    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// Retrieve all user ships
app.get('/ships/myShips/fromUsername', async (req, res) => {
    try {
        const token: any = req.header('x-access-token');
        const user: any = AccessToken.getUser(token);
        const ships: IShip[] = await Ship.find({}, { _id: 0, __v: 0 });
        res.status(200).send(ships);
    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// Update a ship
app.put('/ships/:shipId', async (req, res) => {
    try {
        // Checking if authorized
        const verify: boolean = await Auth.Authorize(req, res, "admin");
        if (!verify) {
            return res.status(400).send({ auth: false, message: 'Not Authorized' });
        }
        // Finding and updating the ship with the given shipId
        const newShip = new Ship(req.body);
        const sId: any = req.params.shipId;
        const ship: IShip = await Ship.findOneAndUpdate({ shipId: sId }, newShip);
        if (!ship)
            return res.status(404).send({ message: "Ship not found with shipId " + req.params.shipId });

        res.status(202).json(ship);
    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// Delete a ship
app.delete('/ships/:shipId', async (req, res) => {
    try {
        // Checking if authorized

        // Finding and deleting the ship with the given shipId
        const sId: any = req.params.shipId;
        const ship: IShip = await Ship.findOneAndDelete({ shipId: sId });
        if (!ship)
            return res.status(404).send({ message: "Ship not found with shipId " + req.params.shipId });

        res.status(202).json(ship);

    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// Retrieve start and finish racepoints from an specific event
app.get('/racePoints/findStartAndFinish/:eventId', async (req, res) => {
    try {
        const evId: any = req.params.eventId;
        const racePoints: IRacePoint[] = await RacePoint.find({ eventId: evId, $or: [{ type: 'startLine' }, { type: 'finishLine' }] }, { _id: 0, __v: 0 });
        res.status(200).json(racePoints);

    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// Retrieve all racepoints from an specific event
app.get('/racepoints/fromEventId/:eventId', async (req, res) => {
    const evId: any = req.params.eventId;
    const racePoints: IRacePoint[] = await RacePoint.find({ eventId: evId }, { _id: 0, __v: 0 }, { sort: { racePointNumber: 1 } });
    return res.status(200).send(racePoints);
});

// Creates a new route of racepoints for an event
app.post('/racepoints/createRoute/:eventId', async (req, res) => {
    try {
        // Create new racepoints

        // Checking if authorized
        const verify: boolean = await Auth.Authorize(req, res, "admin");
        if (!verify) {
            return res.status(400).send({ auth: false, message: 'Not Authorized' });
        }
        // Deleting all previous racePoints
        const evId: any = req.params.eventId;
        RacePoint.deleteMany({ eventId: evId });

        const racePoints = req.body;
        if (Array.isArray(racePoints)) {
            const lastRacePoint: IRacePoint = await RacePoint.findOne({}, {}, { sort: { racepointId: -1 } });
            let racepointId: number;
            const lastRaceP: any = lastRacePoint.racePointId;
            if (lastRacePoint)
                racepointId = lastRaceP;
            else
                racepointId = 1;

            racePoints.forEach(async (racePoint: IRacePoint) => {
                const racepoint = new RacePoint(racePoint);
                racepointId = racepointId + 1;
                racepoint.racePointId = racepointId;

                // Saving the new racepoint in the DB
                await racepoint.save();

                res.status(201).json(racePoints);
            });
        }

        else
            return res.status(400).send();


    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// Retrieve all Users
app.get('/users', async (req, res) => {
    try {

        // Checking if authorized
        const verify: boolean = await Auth.Authorize(req, res, "admin");
        if (!verify) {
            return res.status(400).send({ auth: false, message: 'Not Authorized' });
        }
        // Finding all users
        const users: IUser[] = await User.find({}, { _id: 0, __v: 0 });
        res.status(200).json(users);


    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// Retrieve a single User with the given emailUsername
app.get('/users/:userName', async (req, res) => {
    try {
        // Finding the user with the given userId
        const user: IUser = await User.findOne({ emailUsername: req.params.emailUsername }, { _id: 0, __v: 0 });
        if (!user)
            return res.status(404).send({ message: "User not found with userName " + req.params.emailUsername });

        res.status(200).send(user);

    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// Update a User with the given emailUsername
app.put('/users/:userName', async (req, res) => {
    try {
        // Updating the user
        const hashedPassword = await bcrypt.hashSync(req.body.password);

        const token: any = req.header('x-access-token');

        const user: any = AccessToken.getUser(token);

        await User.findOneAndUpdate({ emailUsername: req.params.userName }, { password: hashedPassword, firstname: req.body.firstname, lastname: req.body.lastname, emailUsername: req.body.emailUsername });

        // if (!user){
        //     return res.status(404).send({ message: "User not found with id " + req.params.emailUsername });
        // }
        res.status(202).send({ message: 'success!' });

    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// Delete a User with the given emailUsername
app.delete('/users/:userName', async (req, res) => {
    try {
        // Deleting the user with the given userId
        const user: IUser = await User.findOneAndDelete({ emailUsername: req.params.emailUsername });
        if (!user)
            return res.status(404).send({ message: "User not found with id " + req.params.emailUsername });

        res.status(202).json(user);

    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// Register a new admin
app.post('/users/registerAdmin', async (req, res) => {
    try {
        // Checking if authorized
        const verify: boolean = await Auth.Authorize(req, res, "admin");
        if (!verify) {
            return res.status(400).send({ auth: false, message: 'Not Authorized' });
        }
        // Checking that no other user with that username exists
        const users: IUser[] = await User.find({ emailUsername: req.body.emailUsername });
        if (users)
            return res.status(409).send({ message: "User with that username already exists" });

        // Creating the new user
        const hashedPassword = bcrypt.hashSync(req.body.password);
        const user = new User(req.body);
        user.password = hashedPassword;
        user.role = "admin";

        await user.save();

        const token = jwt.sign({ id: user.emailUsername, role: "admin" }, process.env.TOKEN_SECRET, { expiresIn: 86400 });
        res.status(201).send({ auth: true, token });


    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// Register a new user
app.post('/users/register', async (req, res) => {
    try {
        // Checking that no user with that username exists
        const isUser: IUser = await User.findOne({ emailUsername: req.body.emailUsername });
        if (isUser)
            return res.status(409).send({ message: "User with that username already exists" });

        // Creating the user
        const hashedPassword = bcrypt.hashSync(req.body.password);
        const user = new User(req.body);
        user.password = hashedPassword;
        user.role = "user";

        await user.save();

        // returning a token
        const token = jwt.sign({ id: user.emailUsername, role: "user" }, process.env.TOKEN_SECRET, { expiresIn: 86400 });
        res.status(201).send({ auth: true, token });

    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// Login
app.post('/users/login', async (req, res) => {
    try {
        // Find the user and validate the password
        const user: IUser = await User.findOne({ emailUsername: req.body.emailUsername });
        if (!user) {
            return res.status(403).json('Username incorrect');
        }

        const userpw: any = user.password;
        const passwordIsValid = bcrypt.compareSync(req.body.password, userpw);

        if (!passwordIsValid) {
            return res.status(401).send({ auth: false, token: null, message: "Invalid password" });
        }

        const token = jwt.sign({ id: user.emailUsername, role: user.role }, process.env.TOKEN_SECRET, { expiresIn: 86400 });
        res.status(200).send({ emailUsername: user.emailUsername, firstname: user.firstname, lastname: user.lastname, auth: true, token });

    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// Create a new EventRegistration
app.post('/eventRegistrations/', async (req, res) => {
    try {
        // Checking if authorized
        const verify: boolean = await Auth.Authorize(req, res, "admin");
        if (!verify) {
            return res.status(400).send({ auth: false, message: 'Not Authorized' });
        }
        // Finding next shipId
        const eventRegistration = new EventRegistration(req.body);
        const regDone: IEventRegistration = await Validate.createRegistration(eventRegistration, res);
        if (regDone === null) {
            return res.status(500).send({ message: "SUCKS FOR YOU" });
        }
        res.status(201).json(regDone);


    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }

});

// Retrieve all eventRegistrations
app.get('/eventRegistrations/', async (req, res) => {
    const verify: boolean = await Auth.Authorize(req, res, "admin");
    if (!verify) {
        return res.status(400).send({ auth: false, message: 'Not Authorized' });
    }

    try {
        const eventRegs: IEventRegistration[] = await EventRegistration.find({}, { _id: 0, __v: 0 });
        res.status(200).send(eventRegs);
    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// Retrieve all eventRegistrations where the given user is a participant
let pending: number = 0;
app.get('/eventRegistrations/findEventRegFromUsername/:eventId', async (req, res) => {
    // Checking if authorized
    const verify: boolean = await Auth.Authorize(req, res, "admin");
    if (!verify) {
        return res.status(400).send({ auth: false, message: 'Not Authorized' });
    }


    try {
        const token: any = req.header('x-access-token');
        const user: any = AccessToken.getUser(token);
        const eventRegistrations: any[] = [];
        const shipByEmailUserName: IShip[] = await Ship.find(user.emailUsername, {
            _id: 0,
            __v: 0
        });
        shipByEmailUserName.forEach(async (ship: IShip) => {
            const evId: any = req.params.eventId;
            const sId: any = ship.shipId;
            const eventRegistration: IEventRegistration[] = await EventRegistration.find({ eventId: evId, shipId: sId }, { _id: 0, __v: 0 })

            eventRegistrations.push(eventRegistration)
        });
        if (eventRegistrations)
            return res.status(200).send(eventRegistrations);


    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// Create an EventRegistration
app.post('/eventRegistrations/signup', async (req, res) => {
    try {

        // Checks that the eventCode is correct
        const event: IEvent = await Event.findOne({ eventCode: req.body.eventCode }, { _id: 0, __v: 0 });
        if (!event)
            return res.status(404).send({ message: "Wrong eventCode" });

        if (event) {
            // Checks that the ship isn't already assigned to the event
            const eventRegistration: IEventRegistration = await EventRegistration.findOne({ shipId: req.body.shipId, eventId: event.eventId }, { _id: 0, __v: 0 });

            if (eventRegistration)
                return res.status(409).send({ message: "ship already registered to this event" })

            if (!eventRegistration) {

                // Creating the eventRegistration
                const registration = new EventRegistration(req.body);
                registration.eventId = event.eventId;
                const regDone: IEventRegistration = await Validate.createRegistration(registration, res);
                if (regDone === null) {
                    return res.status(500).send({ message: "SUCKS FOR YOU" });
                }

                const ship: IShip = await Ship.findOne({ shipId: req.body.shipId });

                // Transporter object using SMTP transport
                const transporter = nodemailer.createTransport({
                    host: "smtp.office365.com",
                    port: 587,
                    secure: false, // true for 465, false for other ports
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PSW,
                    },
                });

                // sending mail with defined transport object
                const info = await transporter.sendMail({
                    from: '"Tregatta" <*INSERT EMAIL*>', // sender address
                    to: req.body.emailUsername, //
                    subject: "Event Participation Confirmation", // subject line
                    text: "your team - " + req.body.teamName + ", is now listed in the event " + event.name + ", with the boat " + ship.name + ".", // text body
                    // html: "<p> some html </p>" // html in the body
                });
                return res.status(201).send({ message: 'Registration successful' });
            }
        }
    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// Delete an EventRegistration with given eventRegId
app.delete('/eventRegistrations/:eventRegId', async (req, res) => {
    // Checking if authorized
    try {
        const evRegId: any = req.params.eventRegId;
        // Finding and deleting the registration with the given regId
        const eventRegistration: IEventRegistration = await EventRegistration.findOneAndDelete({ eventRegId: evRegId });
        if (!eventRegistration)
            return res.status(404).send({ message: "EventRegistration not found with eventRegId " + req.params.eventRegId });
        res.status(202).send({ message: 'Registration deleted' });



    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// Creates an EventRegistration
app.post('/eventRegistrations/addParticipant', async (req, res) => {
    // Checking if authorized
    const verify: boolean = await Auth.Authorize(req, res, "admin");
    if (!verify) {
        return res.status(400).send({ auth: false, message: 'Not Authorized' });
    }
    try {
        // Creates a user if no user corresponding to the given emailUsername found
        const user: IUser = await User.findOne({ emailUsername: req.body.emailUsername }, { _id: 0, __v: 0 });
        if (!user) {

            const hashedPassword = bcrypt.hashSync("1234");
            const newUser = new User({ "emailUsername": req.body.emailUsername, "firstname": req.body.firstname, "lastname": req.body.lastname, "password": hashedPassword, "role": "user" });

            newUser.save();
        }

        // Creating a ship if a ship with the given name and owned by the given user, doesn't exist
        const ship: IShip = await Ship.findOne({ emailUsername: req.body.emailUsername, name: req.body.shipName }, { _id: 0, __v: 0 });
        if (!ship) {

            const newShip = new Ship({ "name": req.body.shipName, "emailUsername": req.body.emailUsername });

            const lastShip: IShip = await Ship.findOne({}, {}, { sort: { shipId: -1 } });
            const one: any = 1;
            if (lastShip)
                newShip.shipId = lastShip.shipId + one;
            else
                newShip.shipId = 1;

            newShip.save();
            const newEventRegistration: IEventRegistration = new EventRegistration({ "eventId": req.body.eventId, "shipId": newShip.shipId, "trackColor": "Yellow", "teamName": req.body.teamName });
            const regDone: IEventRegistration = await Validate.createRegistration(newEventRegistration, res);
            res.status(201).json(regDone);

        }
        else {
            const newEventRegistration = new EventRegistration({ "eventId": req.body.eventId, "shipId": ship.shipId, "trackColor": "Yellow", "teamName": req.body.teamName })
            const regDone: IEventRegistration = await Validate.createRegistration(newEventRegistration, res);
            res.status(201).json(regDone);
        }



    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// Retrieve all EventRegistrations with the given eventId
app.get('/eventRegistrations/getParticipants/:eventId', async (req, res) => {
    try {
        const participants: any[] = [];
        const evId: any = req.params.eventId;
        const eventRegs: IEventRegistration[] = await EventRegistration.find({ eventId: evId }, { _id: 0, __v: 0 });
        if (!eventRegs || eventRegs.length === 0)
            return res.status(404).send({ message: "No participants found" });


        eventRegs.forEach(async (eventRegistration: IEventRegistration) => {
            pending++;

            const ship: IShip = await Ship.findOne({ shipId: eventRegistration.shipId }, { _id: 0, __v: 0 });
            if (!ship)
                return res.status(404).send({ message: "Ship not found" });

            else if (ship) {
                const user: IUser = await User.findOne({ emailUsername: ship.emailUsername }, { _id: 0, __v: 0 });
                pending--;
                if (!user)
                    return res.status(404).send({ message: "User not found" });

                if (user) {
                    const participant: any = {
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

            }
        })





    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// Update EventRegistration
app.put('/eventRegistrations/updateParticipant/:eventRegId', async (req, res) => {
    // Checking if authorized
    const verify: boolean = await Auth.Authorize(req, res, "admin");
    if (!verify) {
        return res.status(400).send({ auth: false, message: 'Not Authorized' });
    }
    try {
        const evRegId: any = req.params.eventRegId;
        const eventReg: IEventRegistration = await EventRegistration.findOneAndUpdate({ eventRegId: evRegId }, req.body);
        if (eventReg) {
            const ship: IShip = await Ship.findOneAndUpdate({ shipId: eventReg.shipId }, req.body);
            if (ship) {
                const user: IUser = await User.findOneAndUpdate({ emailUsername: ship.emailUsername }, req.body);
                if (!user)
                    return res.status(404).send({ message: "User not found with emailUsername " + ship.emailUsername });
                else
                    return res.status(200).send({ updated: "true" })

            }
            else
                return res.status(404).send({ message: "Ship not found with shipId " + eventReg.shipId });

        }
        else
            return res.status(404).send({ message: "EventRegistration not found with eventRegId " + req.params.eventRegId });



    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// Create a new LocationRegistration
app.post('/locationRegistrations/', async (req, res) => {
    try {
        // Creating the LocationRegistration
        let locationRegistration: ILocationRegistration = req.body;
        // Checking if valid
        const val: boolean = await Validate.validateLocationForeignKeys(locationRegistration, res);
        if (!val) {
            return res.status(400).send({ message: 'Could not create' });
        }
        // Finding next regId
        locationRegistration.locationTime.setHours(locationRegistration.locationTime.getHours() + 2);
        const locationReg: ILocationRegistration = await Validate.CheckRacePoint(locationRegistration, res);
        if (locationReg) {
            locationRegistration = locationReg;
        }
        const one: any = 1;
        const lastRegistration: ILocationRegistration = await LocationRegistration.findOne({}, {}, { sort: { regId: -1 } });
        if (lastRegistration)
            locationRegistration.regId = lastRegistration.regId + one;
        else
            locationRegistration.regId = 1;

        await locationRegistration.save();

        return res.status(201).json(locationRegistration);


    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// Retrieve latest LocationRegistrations from specified event
app.get('/locationRegistrations/getLive/:eventId', async (req, res) => {

    try {
        const evId: any = req.params.eventId;
        const eventRegistrations: IEventRegistration[] = await EventRegistration.find({ eventId: evId }, { _id: 0, __v: 0 });


        const fewRegistrations: any[] = [];
        eventRegistrations.forEach(async (eventRegistration: IEventRegistration) => {


            const locationRegistration: ILocationRegistration[] = await LocationRegistration.find({ eventRegId: eventRegistration.eventRegId }, { _id: 0, __v: 0 }, { sort: { 'locationTime': -1 }, limit: 20 });

            if (locationRegistration.length !== 0) {
                const boatLocations: any = { "locationsRegistrations": locationRegistration, "color": eventRegistration.trackColor, "shipId": eventRegistration.shipId, "teamName": eventRegistration.teamName };
                fewRegistrations.push(boatLocations);

            }
        });
        if (fewRegistrations.length !== 0) {
            if (fewRegistrations[0].locationsRegistrations[0].raceScore !== 0) {
                fewRegistrations.sort((a, b) => (a.locationsRegistrations[0].raceScore >= b.locationsRegistrations[0].raceScore) ? -1 : 1)

                for (let i: any = 0; i < fewRegistrations.length; i++) {
                    fewRegistrations[i].placement = i + 1;
                }
            } else {
                fewRegistrations.sort((a, b) => (a.shipId > b.shipId) ? 1 : -1)

            }
        }
        return res.status(200).json(fewRegistrations);



    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// Retrieve all LocationRegistrations from specified event
app.get('/locationRegistrations/getReplay/:eventId', async (req, res) => {

    try {

        const evId: any = req.params.eventId;
        const eventRegistrations: IEventRegistration[] = await EventRegistration.find({ eventId: evId }, { _id: 0, __v: 0 });

        if (eventRegistrations.length !== 0) {
            const shipLocations: any[] = [];
            eventRegistrations.forEach(async (eventRegistration: IEventRegistration) => {

                const locationRegistrations: ILocationRegistration[] = await LocationRegistration.find({ eventRegId: eventRegistration.eventRegId }, { _id: 0, __v: 0 }, { sort: { 'locationTime': 1 } });


                if (locationRegistrations) {
                    const shipLocation = { "locationsRegistrations": locationRegistrations, "color": eventRegistration.trackColor, "shipId": eventRegistration.shipId, "teamName": eventRegistration.teamName }
                    shipLocations.push(shipLocation)
                }
            });

            return res.status(200).send(shipLocations);



        } else {
            return res.status(200).send(eventRegistrations);
        }



    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// Retrieve scoreboard from specific event
app.get('/locationRegistrations/getScoreboard/:eventId', async (req, res) => {
    try {

        const evId: any = req.params.eventId;
        const eventRegistrations: IEventRegistration[] = await EventRegistration.find({ eventId: evId }, { _id: 0, __v: 0 });
        const scores: any[] = [];
        if (eventRegistrations.length !== 0) {

            eventRegistrations.forEach(async (eventReg: IEventRegistration) => {

                const locationRegistration: ILocationRegistration[] = await LocationRegistration.find({ eventRegId: eventReg.eventRegId }, { _id: 0, __v: 0 }, { sort: { 'locationTime': -1 }, limit: 1 });
                if (locationRegistration.length !== 0) {
                    const ship: IShip = await Ship.findOne({ shipId: eventReg.shipId }, { _id: 0, __v: 0 });

                    const user: IUser = await User.findOne({ emailUsername: ship.emailUsername }, { _id: 0, __v: 0 });

                    if (user) {
                        const score: any = { "locationsRegistrations": locationRegistration, "color": eventReg.trackColor, "shipId": eventReg.shipId, "shipName": ship.name, "teamName": eventReg.teamName, "owner": user.firstname + " " + user.lastname };
                        scores.push(score);
                    }
                }
            });

            if (scores.length !== 0) {
                if (scores[0].locationsRegistrations[0].raceScore !== 0) {
                    scores.sort((a, b) => (a.locationsRegistrations[0].raceScore >= b.locationsRegistrations[0].raceScore) ? -1 : 1)

                    for (let i: any = 0; i < scores.length; i++) {
                        scores[i].placement = i + 1;
                    }
                }
                else {
                    scores.sort((a, b) => (a.shipId > b.shipId) ? 1 : -1)
                }
            }
        }
        return res.status(200).send(scores);
    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// Delete all locationRegistrations with a given eventRegId
app.delete('/locationRegistrations/deleteFromEventRegId/:eventId', async (req, res) => {
    // Checking if authorized
    const verify: boolean = await Auth.Authorize(req, res, "user");
    if (!verify) {
        return res.status(400).send({ auth: false, message: 'Not Authorized' });
    }
    try {

        // Finding and deleting the locationRegistrations with the given eventRegId
        const evRegId: any = req.params.eventRegId;
        await LocationRegistration.deleteMany({ eventRegId: evRegId }, {});

        res.status(202).json('Deleted');
    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// NEW FEATURE: Post broadcast messages
app.post('/broadcast', async (req, res) => {
    try {
        // Finds the event with the corresponding eventID
        const evId: any = req.body.eventId;
        const eventRegs: IEventRegistration[] = await EventRegistration.find({ eventId: evId }, { _id: 0, __v: 0 });
        // Checks if there are participants
        if (!eventRegs || eventRegs.length === 0)
            return res.status(404).send({ message: "No participants found" });

        if (eventRegs.length !== 0) {
            // Goes through each participant
            eventRegs.forEach(async (eventRegistration: IEventRegistration) => {

                // Checks if the participant's ship exists
                const ship: IShip = await Ship.findOne({ shipId: eventRegistration.shipId }, { _id: 0, __v: 0 });
                if (!ship)
                    return res.status(404).send({ message: "Ship not found" });

                else if (ship) {
                    // checks if the ship's user exists
                    const user: IUser = await User.findOne({ emailUsername: ship.emailUsername }, { _id: 0, __v: 0 });
                    if (!user)
                        return res.status(404).send({ message: "User not found" });
                    // posts the broadcast with the User of the ship connected to the eventregistration
                    if (user) {
                        const participant = new Broadcast({
                            "eventId": req.body.eventId,
                            "message": req.body.message,
                            "emailUsername": user.emailUsername
                        });
                        await participant.save();
                    }
                }
            });
        }
        res.status(201).send({ message: 'Broadcast successfully sent' });
    } catch (e) {
        res.status(400).json('BAD REQUEST');
    }
});

// NEW FEATURE: Get broadcast message
app.post('/broadcastget/', async (req, res) => {
    try {
        // Gets all the broadcasts related to the user with the use of req.body.Username
        const username: any = req.body.Username;
        const broadcasts: IBroadcast[] = await Broadcast.find({ emailUsername: username }, { _id: 0, __v: 0 });
        await Broadcast.deleteMany({ emailUsername: username });
        res.status(200).json(broadcasts);

    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// NEW FEATURE: forgot password
app.put('/forgotpass', async (req, res) => {
    try {
        // Auto-generates new password
        const password = generator.generate({
            length: 8,
            numbers: true
        });
        // Creates Transport object for sending mail
        const transporter = nodemailer.createTransport({
            host: "smtp.office365.com",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PSW,
            },
        });
        // sending mail with defined transport object
        const info = await transporter.sendMail({
            from: '"Tregatta" <*INSERT EMAIL*>', // sender address
            to: req.body.emailUsername, //
            subject: "Forgotten password", // subject line
            text: "Seems like you forgot your password! here's a new one: " + password + "", // text body
            // html: "<p> some html </p>" // html in the body
        });
        // Updating the user
        const hashedPassword = await bcrypt.hashSync(password);
        await User.findOneAndUpdate({ emailUsername: req.body.emailUsername }, { password: hashedPassword });


        // if (!user){
        //     return res.status(404).send({ message: "User not found with id " + req.params.emailUsername });
        // }
        res.status(200).send({ message: 'Email sent' });



    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});

// NEW FEATURE: Posts an image to the database
app.post('/image', upload.single('image'), async (req, res, next) => {
    try {
        const obj: IImage = new Image();
        const image: IImage = await Image.findOne({ name: req.body.teamName });
        // Checks if the team already has an image
        if (image) {
            res.status(400).send({ message: 'team already has an image' })
        }
        // Reads the image and converts it into a byte[] and saves it in the database, then empties the uploads directory
        else {
            obj.name = req.body.teamName;
            obj.img.data = req.body.image;
            obj.img.contentType = 'image/png';
            await obj.save();
            fsExtra.emptyDirSync('C:\\Users\\'+'*ENTER FILEPATH HERE*'+'\\TheOxbridgeSystemBackend\\uploads/')
            res.status(201).send({ message: 'success!' });
        }

    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }


});

// NEW FEATURE: Gets the all images
app.get('/image', async (req, res) => {
    try {

        const images: IImage[] = await Image.find({});

        res.status(200).json({images});
    } catch (e) {
        res.status(400).json('BAD REQUEST')
    }
});



app.get('*', (req, res) => {
    return res.status(400).send('Page Not Found');
});

export { app, checkTime }