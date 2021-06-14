"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTime = exports.app = void 0;
const mongoose_1 = require("mongoose");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const bodyParser = __importStar(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const event_1 = require("./models/event");
const authentication_controller_1 = require("./controllers/authentication.controller");
const eventRegistration_1 = require("./models/eventRegistration");
const racePoint_1 = require("./models/racePoint");
const accessToken_controller_1 = require("./controllers/accessToken.controller");
const ship_1 = require("./models/ship");
const user_1 = require("./models/user");
const locationRegistration_1 = require("./models/locationRegistration");
const bcrypt_nodejs_1 = __importDefault(require("bcrypt-nodejs"));
const jwt = __importStar(require("jsonwebtoken"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const validate_controller_1 = require("./controllers/validate.controller");
const broadcast_1 = require("./models/broadcast");
const nodemailer_1 = __importDefault(require("nodemailer"));
const date_and_time_1 = __importDefault(require("date-and-time"));
const generate_password_1 = __importDefault(require("generate-password"));
const multer_1 = __importDefault(require("multer"));
const image_1 = require("./models/image");
dotenv_1.default.config({ path: 'config/config.env' });
const app = express_1.default();
exports.app = app;
app.use(cookie_parser_1.default(process.env.TOKEN_SECRET));
app.use(cors_1.default());
const urlencode = bodyParser.urlencoded({ extended: true });
app.use(express_1.default.static('public'));
app.use(bodyParser.json());
mongoose_1.connect(process.env.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
// ROUTING
const router = express_1.default.Router();
// TO PROCESS THE NEXT REQUEST !!
router.use((req, res, next) => {
    console.log("recieved a request now, ready for the next");
    next();
});
const storage = multer_1.default.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now());
    }
});
const upload = multer_1.default({ storage });
// Checks the time to see if it is 3 days before an event
const checkTime = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const currentTime = date_and_time_1.default.format(now, 'YYYY/MM/DD HH');
    console.log(currentTime);
    const events = yield event_1.Event.find({});
    // Checks through all events
    events.forEach((event) => __awaiter(void 0, void 0, void 0, function* () {
        const threeDaysBefore = date_and_time_1.default.addDays(event.eventStart, -3);
        const minusHours = date_and_time_1.default.addHours(threeDaysBefore, -2);
        const eventDate = date_and_time_1.default.format(minusHours, 'YYYY/MM/DD HH');
        console.log(eventDate);
        // checks if eventdate -3days is equals to currenttime
        if (eventDate === currentTime) {
            // Finds all participants in an event and sends an email to them
            const eventRegs = yield eventRegistration_1.EventRegistration.find({ eventId: event.eventId });
            eventRegs.forEach((eventReg) => __awaiter(void 0, void 0, void 0, function* () {
                const ship = yield ship_1.Ship.findOne({ shipId: eventReg.shipId });
                // Transporter object using SMTP transport
                const transporter = nodemailer_1.default.createTransport({
                    host: "smtp.office365.com",
                    port: 587,
                    secure: false,
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PSW,
                    },
                });
                // sending mail with defined transport object
                const info = yield transporter.sendMail({
                    from: '"Tregatta" <andr97e6@easv365.dk>',
                    to: ship.emailUsername,
                    subject: "Event in 3 days!",
                    text: "this is your reminder that in 3 days, " + event.name + " will start, which you are participating in. good luck!", // text body
                    // html: "<p> some html </p>" // html in the body
                });
                console.log('DONE');
            }));
            return true;
        }
    }));
    return false;
});
exports.checkTime = checkTime;
// Calls the checkTime function every hour
setInterval(checkTime, 3600000);
app.use('/', router);
// Retrieve all events
app.get('/events', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const events = yield event_1.Event.find({}, { _id: 0, __v: 0 });
        res.status(200).json(events);
    }
    catch (e) {
        res.status(400).send('BAD REQUEST');
    }
}));
// Create an new event
app.post('/events', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const verify = yield authentication_controller_1.Auth.Authorize(req, res, "admin");
        if (!verify) {
            return res.status(400).send({ auth: false, message: 'Not Authorized' });
        }
        const event = new event_1.Event(req.body);
        const one = 1;
        const lastEvent = yield event_1.Event.findOne({}, {}, {});
        if (lastEvent) {
            event.eventId = lastEvent.eventId + one;
        }
        else {
            event.eventId = 1;
        }
        // Saving the new Event in the DB
        yield event.save();
        res.status(201).json(event);
    }
    catch (e) {
        res.status(400).send('BAD REQUEST');
    }
}));
// Retrieve a single Event with eventId
app.get('/events/:eventId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const evId = req.params.eventId;
        const event = yield event_1.Event.findOne({ eventId: evId }, { _id: 0, __v: 0 });
        if (!event) {
            res.status(400).send('Event not found');
        }
        else {
            res.status(200).send(event);
        }
    }
    catch (e) {
        res.status(400).send('BAD REQUEST');
    }
}));
// Update an Event with given eventId
app.put('/events/:eventId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const verify = yield authentication_controller_1.Auth.Authorize(req, res, "admin");
        if (!verify) {
            return res.status(400).send({ auth: false, message: 'Not Authorized' });
        }
        const newEvent = req.body;
        const evId = req.params.eventId;
        newEvent.eventId = req.params.eventId;
        event_1.Event.updateOne({ eventId: evId }, newEvent);
        res.status(202).json(newEvent);
    }
    catch (e) {
        res.status(400).send('BAD REQUEST');
    }
}));
// Delete an Event with given eventId
app.delete('/events/:eventId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Checking if authorized
        const verify = yield authentication_controller_1.Auth.Authorize(req, res, "admin");
        if (!verify) {
            return res.status(400).send({ auth: false, message: 'Not Authorized' });
        }
        const evId = req.params.eventId;
        // Finding and the deleting the event with the given eventId
        event_1.Event.findOneAndDelete({ eventId: evId });
        // Finding and deleting every EventRegistration with the given eventId
        eventRegistration_1.EventRegistration.deleteMany({ eventId: evId });
        // Finding and deleting every RacePoint with the given eventId
        racePoint_1.RacePoint.deleteMany({ eventId: evId });
        res.status(202).send('Event deleted');
    }
    catch (e) {
        res.status(400).send('BAD REQUEST');
    }
}));
// Updating event property "isLive" to true
app.put('/events/startEvent/:eventId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Checking if authorized
        const verify = yield authentication_controller_1.Auth.Authorize(req, res, "admin");
        if (!verify) {
            return res.status(400).send({ auth: false, message: 'Not Authorized' });
        }
        const evId = req.params.eventId;
        const updatedEvent = { isLive: true, actualEventStart: req.body.actualEventStart };
        event_1.Event.findOneAndUpdate({ eventId: evId }, updatedEvent, { new: true });
        res.status(202).send('Event is now Live');
    }
    catch (e) {
        res.status(400).send('BAD REQUEST');
    }
}));
// Updating event property "isLive" to false
app.get('/events/stopEvent/:eventId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Checking if authorized
        const verify = yield authentication_controller_1.Auth.Authorize(req, res, "admin");
        if (!verify) {
            return res.status(400).send({ auth: false, message: 'Not Authorized' });
        }
        const evId = req.params.eventId;
        event_1.Event.findOneAndUpdate({ eventId: evId }, { isLive: false }, { new: true });
        res.status(202).send('Event Stopped');
    }
    catch (e) {
        res.status(400).send('BAD REQUEST');
    }
}));
// Checks if event with given eventId has a route
app.get('/events/hasRoute/:eventId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const evId = req.params.eventId;
        const racepoints = yield racePoint_1.RacePoint.find({ eventId: evId }, { _id: 0, __v: 0 });
        if (racepoints && racepoints.length !== 0)
            return res.status(200).send(true);
        else
            return res.status(200).send(false);
    }
    catch (e) {
        res.status(400).send('BAD REQUEST');
    }
}));
// Retrieve all events with participant corresponding to primarykey of user, supplied from the token
app.get('/events/myEvents/findFromUsername', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Checking if authorized
        const verify = yield authentication_controller_1.Auth.Authorize(req, res, "admin");
        if (!verify) {
            return res.status(400).send({ auth: false, message: 'Not Authorized' });
        }
        // Finding all the ships the user owns
        const events = [];
        const token = req.header('x-access-token');
        const user = accessToken_controller_1.AccessToken.getUser(token);
        const ships = yield ship_1.Ship.find({ emailUsername: user.id }, { _id: 0, __v: 0 });
        if (ships.length > 0) {
            // Finding all eventRegistrations with a ship that the user owns
            ships.forEach((ship) => __awaiter(void 0, void 0, void 0, function* () {
                const eventRegistrations = yield eventRegistration_1.EventRegistration.find({ shipId: ship.shipId }, { _id: 0, __v: 0 });
                if (eventRegistrations) {
                    eventRegistrations.forEach((eventRegistration) => __awaiter(void 0, void 0, void 0, function* () {
                        ship = yield ship_1.Ship.findOne({ shipId: eventRegistration.shipId }, { _id: 0, __v: 0 });
                        if (ship) {
                            const event = yield event_1.Event.findOne({ eventId: eventRegistration.eventId }, { _id: 0, __v: 0 });
                            if (event) {
                                events.push({ "eventId": event.eventId, "name": event.name, "eventStart": event.eventStart, "eventEnd": event.eventEnd, "city": event.city, "eventRegId": eventRegistration.eventRegId, "shipName": ship.name, "teamName": eventRegistration.teamName, "isLive": event.isLive, "actualEventStart": event.actualEventStart });
                            }
                        }
                    }));
                }
            }));
        }
        res.status(200).send(events);
    }
    catch (e) {
        res.status(400).send('BAD REQUEST');
    }
}));
// Create a new ship
app.post('/ships', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Checking if authorized
        const verify = yield authentication_controller_1.Auth.Authorize(req, res, "user");
        if (!verify) {
            return res.status(400).send({ auth: false, message: 'Not Authorized' });
        }
        const ship = new ship_1.Ship(req.body);
        // Finding next shipId
        const lastShip = yield ship_1.Ship.findOne({}, {}, { sort: { shipId: -1 } });
        if (lastShip) {
            ship.shipId = lastShip.shipId + 1;
        }
        else {
            ship.shipId = 1;
        }
        // Saving the new ship in the DB
        yield ship.save();
        res.status(201).json(ship);
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Retrieve all ships
app.get('/ships', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Finding all ships in the db
        const ships = yield ship_1.Ship.find({}, { _id: 0, __v: 0 });
        res.status(200).json(ships);
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Retrieve a single ship
app.get('/ships/:shipId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sId = req.params.shipId;
        const ship = yield ship_1.Ship.findOne({ shipId: sId }, { _id: 0, __v: 0 });
        if (!ship)
            return res.status(404).send({ message: "Ship with id " + req.params.shipId + " was not found" });
        res.status(200).send({ "name": ship.name, "shipId": ship.shipId });
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Retrieve all ships participating in the given event
app.get('/ships/fromEventId/:eventId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const evId = req.params.eventId;
        const ships = [];
        const eventRegistrations = yield eventRegistration_1.EventRegistration.find({ eventId: evId }, { _id: 0, __v: 0 });
        if (eventRegistrations.length !== 0) {
            eventRegistrations.forEach((eventRegistration) => __awaiter(void 0, void 0, void 0, function* () {
                const ship = yield ship_1.Ship.findOne({ shipId: eventRegistration.shipId }, { _id: 0, __v: 0 });
                if (ship) {
                    ships.push({ "shipId": ship.shipId, "name": ship.name, "teamName": eventRegistration.teamName });
                }
            }));
        }
        res.status(200).json(ships);
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Retrieve all user ships
app.get('/ships/myShips/fromUsername', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.header('x-access-token');
        const user = accessToken_controller_1.AccessToken.getUser(token);
        const ships = yield ship_1.Ship.find({}, { _id: 0, __v: 0 });
        res.status(200).send(ships);
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Update a ship
app.put('/ships/:shipId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Checking if authorized
        const verify = yield authentication_controller_1.Auth.Authorize(req, res, "admin");
        if (!verify) {
            return res.status(400).send({ auth: false, message: 'Not Authorized' });
        }
        // Finding and updating the ship with the given shipId
        const newShip = new ship_1.Ship(req.body);
        const sId = req.params.shipId;
        const ship = yield ship_1.Ship.findOneAndUpdate({ shipId: sId }, newShip);
        if (!ship)
            return res.status(404).send({ message: "Ship not found with shipId " + req.params.shipId });
        res.status(202).json(ship);
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Delete a ship
app.delete('/ships/:shipId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Checking if authorized
        // Finding and deleting the ship with the given shipId
        const sId = req.params.shipId;
        const ship = yield ship_1.Ship.findOneAndDelete({ shipId: sId });
        if (!ship)
            return res.status(404).send({ message: "Ship not found with shipId " + req.params.shipId });
        res.status(202).json(ship);
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Retrieve start and finish racepoints from an specific event
app.get('/racePoints/findStartAndFinish/:eventId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const evId = req.params.eventId;
        const racePoints = yield racePoint_1.RacePoint.find({ eventId: evId, $or: [{ type: 'startLine' }, { type: 'finishLine' }] }, { _id: 0, __v: 0 });
        res.status(200).json(racePoints);
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Retrieve all racepoints from an specific event
app.get('/racepoints/fromEventId/:eventId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const evId = req.params.eventId;
    const racePoints = yield racePoint_1.RacePoint.find({ eventId: evId }, { _id: 0, __v: 0 }, { sort: { racePointNumber: 1 } });
    return res.status(200).send(racePoints);
}));
// Creates a new route of racepoints for an event
app.post('/racepoints/createRoute/:eventId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Create new racepoints
        // Checking if authorized
        const verify = yield authentication_controller_1.Auth.Authorize(req, res, "admin");
        if (!verify) {
            return res.status(400).send({ auth: false, message: 'Not Authorized' });
        }
        // Deleting all previous racePoints
        const evId = req.params.eventId;
        racePoint_1.RacePoint.deleteMany({ eventId: evId });
        const racePoints = req.body;
        if (Array.isArray(racePoints)) {
            const lastRacePoint = yield racePoint_1.RacePoint.findOne({}, {}, { sort: { racepointId: -1 } });
            let racepointId;
            const lastRaceP = lastRacePoint.racePointId;
            if (lastRacePoint)
                racepointId = lastRaceP;
            else
                racepointId = 1;
            racePoints.forEach((racePoint) => __awaiter(void 0, void 0, void 0, function* () {
                const racepoint = new racePoint_1.RacePoint(racePoint);
                racepointId = racepointId + 1;
                racepoint.racePointId = racepointId;
                // Saving the new racepoint in the DB
                yield racepoint.save();
                res.status(201).json(racePoints);
            }));
        }
        else
            return res.status(400).send();
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Retrieve all Users
app.get('/users', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Checking if authorized
        const verify = yield authentication_controller_1.Auth.Authorize(req, res, "admin");
        if (!verify) {
            return res.status(400).send({ auth: false, message: 'Not Authorized' });
        }
        // Finding all users
        const users = yield user_1.User.find({}, { _id: 0, __v: 0 });
        res.status(200).json(users);
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Retrieve a single User with the given emailUsername
app.get('/users/:userName', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Finding the user with the given userId
        const user = yield user_1.User.findOne({ emailUsername: req.params.emailUsername }, { _id: 0, __v: 0 });
        if (!user)
            return res.status(404).send({ message: "User not found with userName " + req.params.emailUsername });
        res.status(200).send(user);
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Update a User with the given emailUsername
app.put('/users/:userName', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Updating the user
        const hashedPassword = yield bcrypt_nodejs_1.default.hashSync(req.body.password);
        const token = req.header('x-access-token');
        const user = accessToken_controller_1.AccessToken.getUser(token);
        yield user_1.User.findOneAndUpdate({ emailUsername: req.params.userName }, { password: hashedPassword, firstname: req.body.firstname, lastname: req.body.lastname, emailUsername: req.body.emailUsername });
        // if (!user){
        //     return res.status(404).send({ message: "User not found with id " + req.params.emailUsername });
        // }
        res.status(202).send({ message: 'success!' });
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Delete a User with the given emailUsername
app.delete('/users/:userName', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Deleting the user with the given userId
        const user = yield user_1.User.findOneAndDelete({ emailUsername: req.params.emailUsername });
        if (!user)
            return res.status(404).send({ message: "User not found with id " + req.params.emailUsername });
        res.status(202).json(user);
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Register a new admin
app.post('/users/registerAdmin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Checking if authorized
        const verify = yield authentication_controller_1.Auth.Authorize(req, res, "admin");
        if (!verify) {
            return res.status(400).send({ auth: false, message: 'Not Authorized' });
        }
        // Checking that no other user with that username exists
        const users = yield user_1.User.find({ emailUsername: req.body.emailUsername });
        if (users)
            return res.status(409).send({ message: "User with that username already exists" });
        // Creating the new user
        const hashedPassword = bcrypt_nodejs_1.default.hashSync(req.body.password);
        const user = new user_1.User(req.body);
        user.password = hashedPassword;
        user.role = "admin";
        yield user.save();
        const token = jwt.sign({ id: user.emailUsername, role: "admin" }, process.env.TOKEN_SECRET, { expiresIn: 86400 });
        res.status(201).send({ auth: true, token });
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Register a new user
app.post('/users/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Checking that no user with that username exists
        const isUser = yield user_1.User.findOne({ emailUsername: req.body.emailUsername });
        if (isUser)
            return res.status(409).send({ message: "User with that username already exists" });
        // Creating the user
        const hashedPassword = bcrypt_nodejs_1.default.hashSync(req.body.password);
        const user = new user_1.User(req.body);
        user.password = hashedPassword;
        user.role = "user";
        yield user.save();
        // returning a token
        const token = jwt.sign({ id: user.emailUsername, role: "user" }, process.env.TOKEN_SECRET, { expiresIn: 86400 });
        res.status(201).send({ auth: true, token });
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Login
app.post('/users/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Find the user and validate the password
        const user = yield user_1.User.findOne({ emailUsername: req.body.emailUsername });
        if (!user) {
            return res.status(403).json('Username incorrect');
        }
        const userpw = user.password;
        const passwordIsValid = bcrypt_nodejs_1.default.compareSync(req.body.password, userpw);
        if (!passwordIsValid) {
            return res.status(401).send({ auth: false, token: null, message: "Invalid password" });
        }
        const token = jwt.sign({ id: user.emailUsername, role: user.role }, process.env.TOKEN_SECRET, { expiresIn: 86400 });
        res.status(200).send({ emailUsername: user.emailUsername, firstname: user.firstname, lastname: user.lastname, auth: true, token });
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Create a new EventRegistration
app.post('/eventRegistrations/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Checking if authorized
        const verify = yield authentication_controller_1.Auth.Authorize(req, res, "admin");
        if (!verify) {
            return res.status(400).send({ auth: false, message: 'Not Authorized' });
        }
        // Finding next shipId
        const eventRegistration = new eventRegistration_1.EventRegistration(req.body);
        const regDone = yield validate_controller_1.Validate.createRegistration(eventRegistration, res);
        if (regDone === null) {
            return res.status(500).send({ message: "SUCKS FOR YOU" });
        }
        res.status(201).json(regDone);
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Retrieve all eventRegistrations
app.get('/eventRegistrations/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const verify = yield authentication_controller_1.Auth.Authorize(req, res, "admin");
    if (!verify) {
        return res.status(400).send({ auth: false, message: 'Not Authorized' });
    }
    try {
        const eventRegs = yield eventRegistration_1.EventRegistration.find({}, { _id: 0, __v: 0 });
        res.status(200).send(eventRegs);
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Retrieve all eventRegistrations where the given user is a participant
let pending = 0;
app.get('/eventRegistrations/findEventRegFromUsername/:eventId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Checking if authorized
    const verify = yield authentication_controller_1.Auth.Authorize(req, res, "admin");
    if (!verify) {
        return res.status(400).send({ auth: false, message: 'Not Authorized' });
    }
    try {
        const token = req.header('x-access-token');
        const user = accessToken_controller_1.AccessToken.getUser(token);
        const eventRegistrations = [];
        const shipByEmailUserName = yield ship_1.Ship.find(user.emailUsername, {
            _id: 0,
            __v: 0
        });
        shipByEmailUserName.forEach((ship) => __awaiter(void 0, void 0, void 0, function* () {
            const evId = req.params.eventId;
            const sId = ship.shipId;
            const eventRegistration = yield eventRegistration_1.EventRegistration.find({ eventId: evId, shipId: sId }, { _id: 0, __v: 0 });
            eventRegistrations.push(eventRegistration);
        }));
        if (eventRegistrations)
            return res.status(200).send(eventRegistrations);
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Create an EventRegistration
app.post('/eventRegistrations/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Checks that the eventCode is correct
        const event = yield event_1.Event.findOne({ eventCode: req.body.eventCode }, { _id: 0, __v: 0 });
        if (!event)
            return res.status(404).send({ message: "Wrong eventCode" });
        if (event) {
            // Checks that the ship isn't already assigned to the event
            const eventRegistration = yield eventRegistration_1.EventRegistration.findOne({ shipId: req.body.shipId, eventId: event.eventId }, { _id: 0, __v: 0 });
            if (eventRegistration)
                return res.status(409).send({ message: "ship already registered to this event" });
            if (!eventRegistration) {
                // Creating the eventRegistration
                const registration = new eventRegistration_1.EventRegistration(req.body);
                registration.eventId = event.eventId;
                const regDone = yield validate_controller_1.Validate.createRegistration(registration, res);
                if (regDone === null) {
                    return res.status(500).send({ message: "SUCKS FOR YOU" });
                }
                const ship = yield ship_1.Ship.findOne({ shipId: req.body.shipId });
                // Transporter object using SMTP transport
                const transporter = nodemailer_1.default.createTransport({
                    host: "smtp.office365.com",
                    port: 587,
                    secure: false,
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PSW,
                    },
                });
                // sending mail with defined transport object
                const info = yield transporter.sendMail({
                    from: '"Tregatta" <andr97e6@easv365.dk>',
                    to: req.body.emailUsername,
                    subject: "Event Participation Confirmation",
                    text: "your team - " + req.body.teamName + ", is now listed in the event " + event.name + ", with the boat " + ship.name + ".", // text body
                    // html: "<p> some html </p>" // html in the body
                });
                return res.status(201).send({ message: 'Registration successful' });
            }
        }
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Delete an EventRegistration with given eventRegId
app.delete('/eventRegistrations/:eventRegId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Checking if authorized
    try {
        const evRegId = req.params.eventRegId;
        // Finding and deleting the registration with the given regId
        const eventRegistration = yield eventRegistration_1.EventRegistration.findOneAndDelete({ eventRegId: evRegId });
        if (!eventRegistration)
            return res.status(404).send({ message: "EventRegistration not found with eventRegId " + req.params.eventRegId });
        res.status(202).send({ message: 'Registration deleted' });
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Creates an EventRegistration
app.post('/eventRegistrations/addParticipant', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Checking if authorized
    const verify = yield authentication_controller_1.Auth.Authorize(req, res, "admin");
    if (!verify) {
        return res.status(400).send({ auth: false, message: 'Not Authorized' });
    }
    try {
        // Creates a user if no user corresponding to the given emailUsername found
        const user = yield user_1.User.findOne({ emailUsername: req.body.emailUsername }, { _id: 0, __v: 0 });
        if (!user) {
            const hashedPassword = bcrypt_nodejs_1.default.hashSync("1234");
            const newUser = new user_1.User({ "emailUsername": req.body.emailUsername, "firstname": req.body.firstname, "lastname": req.body.lastname, "password": hashedPassword, "role": "user" });
            newUser.save();
        }
        // Creating a ship if a ship with the given name and owned by the given user, doesn't exist
        const ship = yield ship_1.Ship.findOne({ emailUsername: req.body.emailUsername, name: req.body.shipName }, { _id: 0, __v: 0 });
        if (!ship) {
            const newShip = new ship_1.Ship({ "name": req.body.shipName, "emailUsername": req.body.emailUsername });
            const lastShip = yield ship_1.Ship.findOne({}, {}, { sort: { shipId: -1 } });
            const one = 1;
            if (lastShip)
                newShip.shipId = lastShip.shipId + one;
            else
                newShip.shipId = 1;
            newShip.save();
            const newEventRegistration = new eventRegistration_1.EventRegistration({ "eventId": req.body.eventId, "shipId": newShip.shipId, "trackColor": "Yellow", "teamName": req.body.teamName });
            const regDone = yield validate_controller_1.Validate.createRegistration(newEventRegistration, res);
            res.status(201).json(regDone);
        }
        else {
            const newEventRegistration = new eventRegistration_1.EventRegistration({ "eventId": req.body.eventId, "shipId": ship.shipId, "trackColor": "Yellow", "teamName": req.body.teamName });
            const regDone = yield validate_controller_1.Validate.createRegistration(newEventRegistration, res);
            res.status(201).json(regDone);
        }
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Retrieve all EventRegistrations with the given eventId
app.get('/eventRegistrations/getParticipants/:eventId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const participants = [];
        const evId = req.params.eventId;
        const eventRegs = yield eventRegistration_1.EventRegistration.find({ eventId: evId }, { _id: 0, __v: 0 });
        if (!eventRegs || eventRegs.length === 0)
            return res.status(404).send({ message: "No participants found" });
        eventRegs.forEach((eventRegistration) => __awaiter(void 0, void 0, void 0, function* () {
            pending++;
            const ship = yield ship_1.Ship.findOne({ shipId: eventRegistration.shipId }, { _id: 0, __v: 0 });
            if (!ship)
                return res.status(404).send({ message: "Ship not found" });
            else if (ship) {
                const user = yield user_1.User.findOne({ emailUsername: ship.emailUsername }, { _id: 0, __v: 0 });
                pending--;
                if (!user)
                    return res.status(404).send({ message: "User not found" });
                if (user) {
                    const participant = {
                        "firstname": user.firstname,
                        "lastname": user.lastname,
                        "shipName": ship.name,
                        "teamName": eventRegistration.teamName,
                        "emailUsername": user.emailUsername,
                        "eventRegId": eventRegistration.eventRegId
                    };
                    participants.push(participant);
                    if (pending === 0) {
                        return res.status(200).json(participants);
                    }
                }
            }
        }));
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Update EventRegistration
app.put('/eventRegistrations/updateParticipant/:eventRegId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Checking if authorized
    const verify = yield authentication_controller_1.Auth.Authorize(req, res, "admin");
    if (!verify) {
        return res.status(400).send({ auth: false, message: 'Not Authorized' });
    }
    try {
        const evRegId = req.params.eventRegId;
        const eventReg = yield eventRegistration_1.EventRegistration.findOneAndUpdate({ eventRegId: evRegId }, req.body);
        if (eventReg) {
            const ship = yield ship_1.Ship.findOneAndUpdate({ shipId: eventReg.shipId }, req.body);
            if (ship) {
                const user = yield user_1.User.findOneAndUpdate({ emailUsername: ship.emailUsername }, req.body);
                if (!user)
                    return res.status(404).send({ message: "User not found with emailUsername " + ship.emailUsername });
                else
                    return res.status(200).send({ updated: "true" });
            }
            else
                return res.status(404).send({ message: "Ship not found with shipId " + eventReg.shipId });
        }
        else
            return res.status(404).send({ message: "EventRegistration not found with eventRegId " + req.params.eventRegId });
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Create a new LocationRegistration
app.post('/locationRegistrations/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Creating the LocationRegistration
        let locationRegistration = req.body;
        // Checking if valid
        const val = yield validate_controller_1.Validate.validateLocationForeignKeys(locationRegistration, res);
        if (!val) {
            return res.status(400).send({ message: 'Could not create' });
        }
        // Finding next regId
        locationRegistration.locationTime.setHours(locationRegistration.locationTime.getHours() + 2);
        const locationReg = yield validate_controller_1.Validate.CheckRacePoint(locationRegistration, res);
        if (locationReg) {
            locationRegistration = locationReg;
        }
        const one = 1;
        const lastRegistration = yield locationRegistration_1.LocationRegistration.findOne({}, {}, { sort: { regId: -1 } });
        if (lastRegistration)
            locationRegistration.regId = lastRegistration.regId + one;
        else
            locationRegistration.regId = 1;
        yield locationRegistration.save();
        return res.status(201).json(locationRegistration);
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Retrieve latest LocationRegistrations from specified event
app.get('/locationRegistrations/getLive/:eventId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const evId = req.params.eventId;
        const eventRegistrations = yield eventRegistration_1.EventRegistration.find({ eventId: evId }, { _id: 0, __v: 0 });
        const fewRegistrations = [];
        eventRegistrations.forEach((eventRegistration) => __awaiter(void 0, void 0, void 0, function* () {
            const locationRegistration = yield locationRegistration_1.LocationRegistration.find({ eventRegId: eventRegistration.eventRegId }, { _id: 0, __v: 0 }, { sort: { 'locationTime': -1 }, limit: 20 });
            if (locationRegistration.length !== 0) {
                const boatLocations = { "locationsRegistrations": locationRegistration, "color": eventRegistration.trackColor, "shipId": eventRegistration.shipId, "teamName": eventRegistration.teamName };
                fewRegistrations.push(boatLocations);
            }
        }));
        if (fewRegistrations.length !== 0) {
            if (fewRegistrations[0].locationsRegistrations[0].raceScore !== 0) {
                fewRegistrations.sort((a, b) => (a.locationsRegistrations[0].raceScore >= b.locationsRegistrations[0].raceScore) ? -1 : 1);
                for (let i = 0; i < fewRegistrations.length; i++) {
                    fewRegistrations[i].placement = i + 1;
                }
            }
            else {
                fewRegistrations.sort((a, b) => (a.shipId > b.shipId) ? 1 : -1);
            }
        }
        return res.status(200).json(fewRegistrations);
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Retrieve all LocationRegistrations from specified event
app.get('/locationRegistrations/getReplay/:eventId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const evId = req.params.eventId;
        const eventRegistrations = yield eventRegistration_1.EventRegistration.find({ eventId: evId }, { _id: 0, __v: 0 });
        if (eventRegistrations.length !== 0) {
            const shipLocations = [];
            eventRegistrations.forEach((eventRegistration) => __awaiter(void 0, void 0, void 0, function* () {
                const locationRegistrations = yield locationRegistration_1.LocationRegistration.find({ eventRegId: eventRegistration.eventRegId }, { _id: 0, __v: 0 }, { sort: { 'locationTime': 1 } });
                if (locationRegistrations) {
                    const shipLocation = { "locationsRegistrations": locationRegistrations, "color": eventRegistration.trackColor, "shipId": eventRegistration.shipId, "teamName": eventRegistration.teamName };
                    shipLocations.push(shipLocation);
                }
            }));
            return res.status(200).send(shipLocations);
        }
        else {
            return res.status(200).send(eventRegistrations);
        }
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Retrieve scoreboard from specific event
app.get('/locationRegistrations/getScoreboard/:eventId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const evId = req.params.eventId;
        const eventRegistrations = yield eventRegistration_1.EventRegistration.find({ eventId: evId }, { _id: 0, __v: 0 });
        const scores = [];
        if (eventRegistrations.length !== 0) {
            eventRegistrations.forEach((eventReg) => __awaiter(void 0, void 0, void 0, function* () {
                const locationRegistration = yield locationRegistration_1.LocationRegistration.find({ eventRegId: eventReg.eventRegId }, { _id: 0, __v: 0 }, { sort: { 'locationTime': -1 }, limit: 1 });
                if (locationRegistration.length !== 0) {
                    const ship = yield ship_1.Ship.findOne({ shipId: eventReg.shipId }, { _id: 0, __v: 0 });
                    const user = yield user_1.User.findOne({ emailUsername: ship.emailUsername }, { _id: 0, __v: 0 });
                    if (user) {
                        const score = { "locationsRegistrations": locationRegistration, "color": eventReg.trackColor, "shipId": eventReg.shipId, "shipName": ship.name, "teamName": eventReg.teamName, "owner": user.firstname + " " + user.lastname };
                        scores.push(score);
                    }
                }
            }));
            if (scores.length !== 0) {
                if (scores[0].locationsRegistrations[0].raceScore !== 0) {
                    scores.sort((a, b) => (a.locationsRegistrations[0].raceScore >= b.locationsRegistrations[0].raceScore) ? -1 : 1);
                    for (let i = 0; i < scores.length; i++) {
                        scores[i].placement = i + 1;
                    }
                }
                else {
                    scores.sort((a, b) => (a.shipId > b.shipId) ? 1 : -1);
                }
            }
        }
        return res.status(200).send(scores);
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// Delete all locationRegistrations with a given eventRegId
app.delete('/locationRegistrations/deleteFromEventRegId/:eventId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Checking if authorized
    const verify = yield authentication_controller_1.Auth.Authorize(req, res, "user");
    if (!verify) {
        return res.status(400).send({ auth: false, message: 'Not Authorized' });
    }
    try {
        // Finding and deleting the locationRegistrations with the given eventRegId
        const evRegId = req.params.eventRegId;
        yield locationRegistration_1.LocationRegistration.deleteMany({ eventRegId: evRegId }, {});
        res.status(202).json('Deleted');
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// NEW FEATURE: Post broadcast messages
app.post('/broadcast', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Finds the event with the corresponding eventID
        const evId = req.body.eventId;
        const eventRegs = yield eventRegistration_1.EventRegistration.find({ eventId: evId }, { _id: 0, __v: 0 });
        // Checks if there are participants
        if (!eventRegs || eventRegs.length === 0)
            return res.status(404).send({ message: "No participants found" });
        if (eventRegs.length !== 0) {
            // Goes through each participant
            eventRegs.forEach((eventRegistration) => __awaiter(void 0, void 0, void 0, function* () {
                // Checks if the participant's ship exists
                const ship = yield ship_1.Ship.findOne({ shipId: eventRegistration.shipId }, { _id: 0, __v: 0 });
                if (!ship)
                    return res.status(404).send({ message: "Ship not found" });
                else if (ship) {
                    // checks if the ship's user exists
                    const user = yield user_1.User.findOne({ emailUsername: ship.emailUsername }, { _id: 0, __v: 0 });
                    if (!user)
                        return res.status(404).send({ message: "User not found" });
                    // posts the broadcast with the User of the ship connected to the eventregistration
                    if (user) {
                        const participant = new broadcast_1.Broadcast({
                            "eventId": req.body.eventId,
                            "message": req.body.message,
                            "emailUsername": user.emailUsername
                        });
                        yield participant.save();
                    }
                }
            }));
        }
        res.status(201).send({ message: 'Broadcast successfully sent' });
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// NEW FEATURE: Get broadcast message
app.post('/broadcastget/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Gets all the broadcasts related to the user with the use of req.body.Username
        const username = req.body.Username;
        const broadcasts = yield broadcast_1.Broadcast.find({ emailUsername: username }, { _id: 0, __v: 0 });
        yield broadcast_1.Broadcast.deleteMany({ emailUsername: username });
        res.status(200).json(broadcasts);
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// NEW FEATURE: forgot password
app.put('/forgotpass', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Auto-generates new password
        const password = generate_password_1.default.generate({
            length: 8,
            numbers: true
        });
        // Creates Transport object for sending mail
        const transporter = nodemailer_1.default.createTransport({
            host: "smtp.office365.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PSW,
            },
        });
        // sending mail with defined transport object
        const info = yield transporter.sendMail({
            from: '"Tregatta" <andr97e6@easv365.dk>',
            to: req.body.emailUsername,
            subject: "Forgotten password",
            text: "Seems like you forgot your password! here's a new one: " + password + "", // text body
            // html: "<p> some html </p>" // html in the body
        });
        // Updating the user
        const hashedPassword = yield bcrypt_nodejs_1.default.hashSync(password);
        yield user_1.User.findOneAndUpdate({ emailUsername: req.body.emailUsername }, { password: hashedPassword });
        // if (!user){
        //     return res.status(404).send({ message: "User not found with id " + req.params.emailUsername });
        // }
        res.status(200).send({ message: 'Email sent' });
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// NEW FEATURE: Posts an image to the database
app.post('/image', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const obj = new image_1.Image();
        const image = yield image_1.Image.findOne({ name: req.body.teamName });
        // Checks if the team already has an image
        if (image) {
            res.status(400).send({ message: 'team already has an image' });
        }
        // Reads the image and converts it into a byte[] and saves it in the database, then empties the uploads directory
        else {
            obj.name = req.body.teamName;
            obj.data = req.body.data;
            yield obj.save();
            res.status(201).send({ message: 'success!' });
        }
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
// NEW FEATURE: Gets the all images
app.get('/image', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const images = yield image_1.Image.find({});
        res.status(200).json({ images });
    }
    catch (e) {
        res.status(400).json('BAD REQUEST');
    }
}));
app.get('*', (req, res) => {
    return res.status(400).send('Page Not Found');
});
//# sourceMappingURL=server.js.map