import express from 'express';
import { Event, IEvent } from "../models/event";
import { EventRegistration, IEventRegistration } from '../models/eventRegistration'
import { Ship, IShip } from '../models/ship'




export class Validate {
    static async validateForeignKeys(registration: IEventRegistration, res: express.Response): Promise<Boolean> {
        // Checking if ship exists
        const ship: IShip = await Ship.findOne({ shipId: registration.shipId })
        if (!ship) {
            return false;
        }
        // Checking if event exists
        const event: IEvent = await Event.findOne({ eventId: registration.eventId });
        if (!event) {
            return false;
        }
    }

    static async createRegistration(newRegistration: IEventRegistration, res: express.Response): Promise<IEventRegistration> {

        const val:Boolean = await this.validateForeignKeys(newRegistration,res);
        if(!val){
            return null;
        }
        // Finding next eventRegId
        const lastEventRegistration: IEventRegistration = await EventRegistration.findOne({}).sort('-desc');
        const one: any = 1;
        if (lastEventRegistration)
            newRegistration.eventRegId = lastEventRegistration.eventRegId + one;
        else
            newRegistration.eventRegId = 1;

        newRegistration.save();
        return newRegistration;
    }
    static FindDistance(registration: any, racePoint: any): any {
        const checkPoint1 = {
            longtitude: Number,
            latitude: Number
        };
        const checkPoint2 = {
            longtitude: Number,
            latitude: Number
        };

        checkPoint1.longtitude = racePoint.firstLongtitude;
        checkPoint1.latitude = racePoint.firstLatitude;
        checkPoint2.longtitude = racePoint.secondLongtitude;
        checkPoint2.latitude = racePoint.secondLatitude;

        const AB: any = Validate.CalculateDistance(checkPoint1, checkPoint2);
        const BC: any = Validate.CalculateDistance(checkPoint2, registration);
        const AC: any = Validate.CalculateDistance(checkPoint1, registration);

        const P: number = (AB + BC + AC) / 2;
        const S: number = Math.sqrt(P * (P - AC) * (P - AB) * (P - AC));

        const result = 2 * S / AB;
        return result
    }
    static CalculateDistance(checkPoint1: { longtitude: any; latitude: any; }, checkPoint2: { longtitude: any; latitude: any; }): Number {
        const R = 6371e3; // metres
        const φ1 = checkPoint1.latitude * Math.PI / 180; // φ, λ in radians
        const φ2 = checkPoint2.latitude * Math.PI / 180;
        const Δφ = (checkPoint2.latitude - checkPoint1.latitude) * Math.PI / 180;
        const Δλ = (checkPoint2.longtitude - checkPoint1.longtitude) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        // noinspection UnnecessaryLocalVariableJS
        const d = R * c;

        return d;
    }

}