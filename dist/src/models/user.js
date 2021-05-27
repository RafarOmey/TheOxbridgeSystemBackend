"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    firstname: { type: String },
    lastname: { type: String },
    emailUsername: { type: String },
    password: { type: String },
    role: { type: String },
});
const User = mongoose_1.model('User', UserSchema);
exports.User = User;
//# sourceMappingURL=user.js.map