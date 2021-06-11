"use strict";
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
const server_1 = require("../server");
const supertest_1 = __importDefault(require("supertest"));
const api = server_1.app;
describe("GET single event", () => {
    it("should GET event by ID", () => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield supertest_1.default(api).get("/events/1236");
        expect(result.body).toEqual({ "city": "alksdjl", "eventCode": "1234", "eventEnd": "2021-06-23T13:00:00.000Z", "eventId": 1236, "eventStart": "2021-06-04T14:00:00.000Z", "name": "new event" });
        expect(result.status).toEqual(200);
    }));
});
// REMEMBER TO INSERT EMAIL
describe("post eventRegistration", () => {
    it("POST should insert an eventregistration", () => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield supertest_1.default(api).post("/eventRegistrations/signup").send({ "shipId": "4", "teamName": "CoolTeam", "eventCode": "1234", "emailUsername": "*INSERT EMAIL HERE*" });
        expect(result.body).toEqual({ message: 'Registration successful' });
        expect(result.status).toEqual(201);
    }));
    it("ship already registered", () => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield supertest_1.default(api).post("/eventRegistrations/signup").send({ "shipId": "4", "teamName": "CoolTeam", "eventCode": "1234", "emailUsername": "*INSERT EMAIL HERE*" });
        expect(result.body).toEqual({ message: 'ship already registered to this event' });
        expect(result.status).toEqual(409);
    }));
});
describe("delete eventRegistration", () => {
    it("DELETE should delete an eventregistration", () => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield supertest_1.default(api).delete("/eventRegistrations/4");
        expect(result.body).toEqual({ message: 'Registration deleted' });
        expect(result.status).toEqual(202);
    }));
});
// REMEMBER TO INSERT EMAIL
describe("forgot password", () => {
    it("PUT should give the user a new password", () => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield supertest_1.default(api).put("/forgotpass").send({ "emailUsername": "*INSERT EMAIL HERE*" });
        expect(result.body).toEqual({ message: 'Email sent' });
        expect(result.status).toEqual(200);
    }));
});
describe("broadcast", () => {
    it("POST should post a broadcast message to participants of a certain event", () => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield supertest_1.default(api).post("/broadcast").send({ "eventId": "1236", "message": "this is a Jest message" });
        expect(result.body).toEqual({ message: 'Broadcast successfully sent' });
        expect(result.status).toEqual(201);
    }));
});
describe("check time function to check if it's 3 days before an event", () => {
    it("should return TRUE if there are 3 days left before an event, and should return false if there isn't", () => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield server_1.checkTime();
        if (result) {
            expect(result).toEqual(true);
        }
        else if (!result) {
            expect(result).toEqual(false);
        }
    }));
});
//# sourceMappingURL=test.spec.js.map