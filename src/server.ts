import {connect} from "mongoose";
import express from 'express';
import cors from 'cors';
import * as mongoose from 'mongoose';
import * as bodyParser from 'body-parser';
import dotenv from 'dotenv';
import {Event} from "./models/event";

dotenv.config({path:'config/config.env'});



const app = express();

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
router.use(function (req, res, next) {
    console.log("recieved a request now, ready for the next");
    next();
});

app.use('/', router);
// FINDALL EVENTS
app.get('/events', (req,res) => {
    Event.find({}, {_id: 0, __v: 0}, null, (err, events): any => {
        if (err)
            return res.status(500).send({message: err.message || "Some error occurred while retriving events"});

        res.status(201).json(events);
    });
    
});

export{app}