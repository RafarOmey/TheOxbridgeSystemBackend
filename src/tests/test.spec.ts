import { app, checkTime } from "../server";
import request from "supertest";
import { IEvent, Event } from "../models/event";

const api = app;


describe("GET single event", () => {
    it("should GET event by ID", async () => {
        const result = await request(api).get("/events/1236");
        expect(result.body).toEqual({ "city": "alksdjl", "eventCode": "1234", "eventEnd": "2021-06-23T13:00:00.000Z", "eventId": 1236, "eventStart": "2021-06-04T14:00:00.000Z", "name": "new event" });
        expect(result.status).toEqual(200);
    });
});

// REMEMBER TO INSERT EMAIL
describe("post eventRegistration", () => {
    it("POST should insert an eventregistration", async () => {
        const result = await request(api).post("/eventRegistrations/signup").send({ "shipId": "4", "teamName": "CoolTeam", "eventCode": "1234", "emailUsername": "*INSERT EMAIL HERE*" });
        expect(result.body).toEqual({ message: 'Registration successful' });
        expect(result.status).toEqual(201);
    });
    it("ship already registered", async () => {
        const result = await request(api).post("/eventRegistrations/signup").send({ "shipId": "4", "teamName": "CoolTeam", "eventCode": "1234", "emailUsername": "*INSERT EMAIL HERE*" });
        expect(result.body).toEqual({ message: 'ship already registered to this event' });
        expect(result.status).toEqual(409);
    });
});

describe("delete eventRegistration", () => {
    it("DELETE should delete an eventregistration", async () => {
        const result = await request(api).delete("/eventRegistrations/4");
        expect(result.body).toEqual({ message: 'Registration deleted' });
        expect(result.status).toEqual(202);
    });
});

// REMEMBER TO INSERT EMAIL
describe("forgot password", () => {
    it("PUT should give the user a new password", async () => {
        const result = await request(api).put("/forgotpass").send({ "emailUsername": "*INSERT EMAIL HERE*" });
        expect(result.body).toEqual({ message: 'Email sent' });
        expect(result.status).toEqual(200);
    });
});

describe("broadcast", () => {
    it("POST should post a broadcast message to participants of a certain event", async () => {
        const result = await request(api).post("/broadcast").send({ "eventId": "1236", "message": "this is a Jest message" });
        expect(result.body).toEqual({ message: 'Broadcast successfully sent' });
        expect(result.status).toEqual(201);
    });
});

describe("check time function to check if it's 3 days before an event", () => {
    it("should return TRUE if there are 3 days left before an event, and should return false if there isn't", async () => {
        const result = await checkTime()
        if (result) {
            expect(result).toEqual(true);
        } else if(!result){
            expect(result).toEqual(false);
        }
    });
});


