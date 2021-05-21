import * as jwt from "jsonwebtoken";
import * as dotenv from 'dotenv';
import {Request,Response} from 'express';
import {AccessToken} from './accessToken.controller'
dotenv.config({ path: 'config/config.env' }); // NEW

export const Authorize = (req:Request,res:Response, role:String) => {
    // Checks if a token is provided
    const token = req.header('x-access-token');
    if (!token){
        return res.status(401).json({auth: false, message: 'No token provided'});
    }
    // Verifying the token
    jwt.verify(token, process.env.SECRET, (err, decoded) => {
        if (err)
            return res.status(500).json({auth: false, message: 'Failed to authenticate token'});

        // Verifying that the request is allowed by the requesting role
        if (role === "admin" && AccessToken.userRole(token) !== "admin")
            return res.status(401).json({auth: false, message: 'Not authorized'});

        return res.status(201).json({auth:true,message:'success'});
    });

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

