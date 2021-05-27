"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_decode_1 = __importDefault(require("jwt-decode"));
const expiresIn = '2h';
class AccessToken {
    static generateToken(role) {
        const t = jsonwebtoken_1.default.sign({ 'role': role }, process.env.TOKEN_SECRET, { expiresIn });
        return t;
    }
    static userRole(token) {
        const decodedToken = jwt_decode_1.default(token);
        // console.log(decodedToken.role);
        return decodedToken.role;
    }
    static getUser(token) {
        const decodedToken = jwt_decode_1.default(token);
        // console.log(decodedToken.role);
        return decodedToken;
    }
}
exports.AccessToken = AccessToken;
//# sourceMappingURL=accessToken.controller.js.map