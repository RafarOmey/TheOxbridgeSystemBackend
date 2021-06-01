import express from 'express';
import { Event, IEvent } from "../models/event";
import { EventRegistration, IEventRegistration } from '../models/eventRegistration'
import { Ship, IShip } from '../models/ship'
import { LocationRegistration, ILocationRegistration } from '../models/locationRegistration'
import { RacePoint, IRacePoint } from '../models/racePoint'




export class Validate {
    static async validateEventForeignKeys(registration: IEventRegistration, res: express.Response): Promise<boolean> {
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

        // const val: boolean = await this.validateEventForeignKeys(newRegistration, res);
        // if (!val) {
        //     return null;
        // }
        // Finding next eventRegId
        const lastEventRegistration: IEventRegistration = await EventRegistration.findOne({},{},{sort:{eventRegId:-1}});
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
    static CalculateDistance(checkPoint1: { longtitude: any; latitude: any; }, checkPoint2: { longtitude: any; latitude: any; }): number {
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

    static async validateLocationForeignKeys(registration: ILocationRegistration, res: express.Response): Promise<boolean> {

        // Checking if eventReg exists
        const eventReg: IEventRegistration = await EventRegistration.findOne({ eventRegId: registration.eventRegId });
        if (!eventReg) {
            return false;
        }
        return true;

    }

    static async CheckRacePoint(registration: ILocationRegistration, res: express.Response): Promise<any> {
        const eventRegistration: IEventRegistration = await EventRegistration.findOne({ eventRegId: registration.eventRegId }, { _id: 0, __v: 0 });

        // Checks which racepoint the ship has reached last
        let nextRacePointNumber = 2;
        const one: any = 1;
        const locationRegistration: ILocationRegistration = await LocationRegistration.findOne({ eventRegId: registration.eventRegId }, { _id: 0, __v: 0 }, { sort: { 'locationTime': -1 } });
        if (locationRegistration) {
            nextRacePointNumber = locationRegistration.racePointNumber + one;
            if (locationRegistration.finishTime !== null) {
                const updatedRegistration = registration;
                updatedRegistration.racePointNumber = locationRegistration.racePointNumber;
                updatedRegistration.raceScore = locationRegistration.raceScore;
                updatedRegistration.finishTime = locationRegistration.finishTime;
                return updatedRegistration;
            }
        }

        if (eventRegistration) {
            const event: IEvent = await Event.findOne({ eventId: eventRegistration.eventId }, { _id: 0, __v: 0 });
            if (event && event.isLive) {

                // Finds the next racepoint and calculates the ships distance to the racepoint
                // and calculates the score based on the distance
                const nextRacePoint: IRacePoint = await RacePoint.findOne({ eventId: eventRegistration.eventId, racePointNumber: nextRacePointNumber }, { _id: 0, __v: 0 });
                if (nextRacePoint) {
                    let distance: any = this.FindDistance(registration, nextRacePoint);
                    if (distance < 25) {

                        if (nextRacePoint.type !== "finishLine") {
                            const newNextRacePoint: IRacePoint = await RacePoint.findOne({ eventId: eventRegistration.eventId, racePointNumber: nextRacePoint.racePointNumber + one }, { _id: 0, __v: 0 });


                            if (newNextRacePoint) {
                                const nextPointDistance: any = this.FindDistance(registration, newNextRacePoint);
                                distance = nextPointDistance;

                                const updatedRegistration = registration;
                                updatedRegistration.racePointNumber = nextRacePointNumber;
                                updatedRegistration.raceScore = ((nextRacePointNumber) * 10) + ((nextRacePointNumber) / distance);
                                return updatedRegistration;



                            }
                        } else {
                            const updatedRegistration = registration;
                            updatedRegistration.racePointNumber = nextRacePointNumber;
                            updatedRegistration.finishTime = registration.locationTime
                            const ticks = ((registration.locationTime.getTime() * 10000) + 621355968000000000);
                            updatedRegistration.raceScore = (1000000000000000000 - ticks) / 1000000000000
                            return updatedRegistration;
                        }
                    } else {
                        const updatedRegistration = registration;
                        updatedRegistration.racePointNumber = nextRacePointNumber - 1;
                        updatedRegistration.raceScore = ((nextRacePointNumber - 1) * 10) + ((nextRacePointNumber - 1) / distance);
                        return updatedRegistration;
                    }

                } else {
                    const updatedRegistration = registration;
                    updatedRegistration.racePointNumber = 1;
                    updatedRegistration.raceScore = 0;
                    return updatedRegistration;

                }
            } else {
                const updatedRegistration = registration;
                updatedRegistration.racePointNumber = 1;
                updatedRegistration.raceScore = 0;
                return updatedRegistration;
            }

        }
    }

}