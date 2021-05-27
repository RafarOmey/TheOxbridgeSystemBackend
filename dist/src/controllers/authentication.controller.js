"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auth = void 0;
const dotenv = __importStar(require("dotenv"));
const accessToken_controller_1 = require("./accessToken.controller");
dotenv.config({ path: 'config/config.env' }); // NEW
class Auth {
    static Authorize(req, res, role) {
        return __awaiter(this, void 0, void 0, function* () {
            // Checks if a token is provided
            const token = req.header('x-access-token');
            if (!token) {
                return false;
            }
            const verify = this.verify(token, process.env.TOKEN_SECRET, role);
            if (!verify) {
                return false;
            }
            else if (verify) {
                return true;
            }
        });
    }
    // Verifying the token
    static verify(token, secret, role) {
        return __awaiter(this, void 0, void 0, function* () {
            // Verifying that the request is allowed by the requesting role
            if (role === "admin" && accessToken_controller_1.AccessToken.userRole(token) !== "admin")
                return false;
            else
                return true;
        });
    }
    static getUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const token = req.header('x-access-token');
            const user = accessToken_controller_1.AccessToken.getUser(token);
            return user;
        });
    }
}
exports.Auth = Auth;
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
//# sourceMappingURL=authentication.controller.js.map