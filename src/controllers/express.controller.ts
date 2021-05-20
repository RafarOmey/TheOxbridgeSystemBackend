import express from 'express';
import session from 'express-session';
import cors from 'cors';
import * as mongoose from 'mongoose';
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';

dotenv.config({path:'config/config.env'});
const app = express();

app.use(cookieParser(process.env.TOKEN_SECRET));
app.use(cors());
app.use(bodyParser.json());

// let urlencode = bodyParser.urlencoded({ extended: true });
app.use(express.static('public'));

// The routes:

// *********** OAUTH-Stuff (middle) *************/
app.set('view engine', 'ejs');
app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: process.env.TOKEN_SECRET
}));


export {app}