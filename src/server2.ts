import 'reflect-metadata';
import {Request, Response} from 'express';
import express from "express";

const app = express();

app.get('/', (req: Request, res: Response) => {
    res.send('Hello there!');
});

app.listen(3000, () => {
    console.log('Started express on port 3000');
});