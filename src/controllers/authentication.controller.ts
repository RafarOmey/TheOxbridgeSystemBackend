import * as jwt from "jsonwebtoken";
import * as dotenv from 'dotenv';
import { Request, Response } from 'express';
import { AccessToken } from './accessToken.controller'
dotenv.config({ path: 'config/config.env' }); // NEW

export class Auth {
    // Authorizes if the token and the user's role are valid
    static async Authorize(req: Request, res: Response, role: string):Promise<boolean> {
        // Checks if a token is provided
        const token = req.header('x-access-token');
        if(!token){
            return false;
        }
        const verify: Promise<boolean> = this.verify(token, process.env.TOKEN_SECRET, role);
        if (!verify) {
            return false;
        }
        else if (verify) {
            return true;
        }
    }
    // Verifying the token
    static async verify(token: any, secret: string, role: string): Promise<boolean> {

        // Verifying that the request is allowed by the requesting role
        if (role === "admin" && AccessToken.userRole(token) !== "admin")
            return false;

        else
            return true;
    }
}



/*import * as jwt from "jsonwebtoken";
import * as dotenv from 'dotenv';
import {app} from './express.controller'

dotenv.config({path: 'config/config.env'});


export const Authorize = (req:Request, res: Response, role: string) => {
        // Checks if a token is provided
        const token = req.headers('x-access-token');
        if(!token)
            return callback(res.status(401).send({auth: false, message: 'No token provided'}),null);

        // Verifying the token
        jwt.verify(token, process.env.TOKEN_SECRET, function(err, decoded){
            if(err)
                return res.status(500).json('Failed to authenticate token');

            // Verifying that the request is allowed by the requesting role
            if(role === "admin" && decoded.role !== "admin")
                return callback(res.status(401).send({auth: false, message: 'Not authorized'}),null);

            return callback(null, decoded);
        });

}



*/

