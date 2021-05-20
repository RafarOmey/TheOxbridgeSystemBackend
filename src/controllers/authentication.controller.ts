export {};
import * as jwt from "jsonwebtoken";
import * as dotenv from 'dotenv';
dotenv.config({ path: 'config/playground.env' }); // NEW

export const Authorize = (req, res, role, callback) => {
    // Checks if a token is provided
    const token = req.headers['x-access-token'];
    if (!token)
        return callback(res.status(401).send({auth: false, message: 'No token provided'}));

    // Verifying the token
    jwt.verify(token, process.env.SECRET, (err, decoded) => {
        if (err)
            return callback(res.status(500).send({auth: false, message: 'Failed to authenticate token'}));

        // Verifying that the request is allowed by the requesting role
        if (role === "admin" && decoded.role !== "admin")
            return callback(res.status(401).send({auth: false, message: 'Not authorized'}));

        return callback(null, decoded);
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

