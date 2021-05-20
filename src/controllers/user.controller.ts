const User = require('../models/user.js');
const Auth = require('./authentication.controller.js');

let jwt = require('jsonwebtoken');
let bcrypt = require('bcryptjs');
let config = require('../../config/config');


// Retrieve and return all users from the database.
exports.findAll = (req, res) => {

    // Checking if authorized
    Auth.Authorize(req, res, "admin", function (err) {
        if (err)
            return err;

        // Finding all users
        User.find({}, { _id: 0, __v: 0 }, function (err, users) {
            if (err)
                return res.status(500).send({ message: err.message || "Some error occurred while retriving users" });

            res.status(200).json(users);
        });
    });
};

// Find a single user with the specified emailUsername
exports.findOne = (req, res) => {

    // Checking if authorized
    Auth.Authorize(req, res, "user", function (err) {
        if (err)
            return err;

        // Finding the user with the given userId
        User.findOne({ emailUsername: req.params.emailUsername }, { _id: 0, __v: 0 }, function (err, user) {
            if (err)
                return res.status(500).send({ message: "Error retrieving user with userName " + req.params.emailUsername });
            if (!user)
                return res.status(404).send({ message: "User not found with userName " + req.params.emailUsername });

            res.status(200).send(user);
        });
    });
};

// Update a user with the specified emailUsername
exports.update = (req, res) => {

    // Checking if authorized
    Auth.Authorize(req, res, "user", function (err, decoded) {
        if (err)
            return err;

        // Updating the user
        const hashedPassword = bcrypt.hashSync(req.body.password, 10);
        const newUser = new User(req.body);
        newUser.password = hashedPassword;
        newUser.role = decoded.role;

        User.findOneAndUpdate({ emailUsername: newUser.emailUsername }, newUser, function (err, user) {
            if (err)
                res.send(err);
            if (!user)
                return res.status(404).send({ message: "User not found with id " + req.params.emailUsername });

            res.status(202).json(user);
        });
    });
};

// Delete a user with the specified emailUsername
exports.delete = (req, res) => {

    // Checking if authorized
    Auth.Authorize(req, res, "user", function (err) {
        if (err)
            return err;

        // Deleting the user with the given userId
        User.findOneAndDelete({ emailUsername: req.params.emailUsername }, function (err, user) {
            if (err)
                res.send(err);
            if (!user)
                return res.status(404).send({ message: "User not found with id " + req.params.emailUsername });

            res.status(202).json(user);
        });
    });
};

// Register a new admin user and return token
exports.registerAdmin = (req, res) => {

    // Checking if authorized
    Auth.Authorize(req, res, "admin", function (err) {
        if (err)
            return err;

        // Checking that no other user with that username exists
        User.find({ emailUsername: req.body.emailUsername }, function (err, users) {
            if (err)
                return res.status(500).send({ message: err.message || "Some error occurred while retriving users" });

            if (users)
                return res.status(409).send({ message: "User with that username already exists" });

            // Creating the new user
            const hashedPassword = bcrypt.hashSync(req.body.password, 10);
            const user = new User(req.body);
            user.password = hashedPassword;
            user.role = "admin";

            user.save(function (err) {
                if (err)
                    return res.status(500).send("There was a problem registrating the user");

                const token = jwt.sign({ id: user.emailUsername, role: "admin" }, config.secret, { expiresIn: 86400 });
                res.status(201).send({ auth: true, token });
            });
        });
    });
};

// Register a new user and return token
exports.register = (req, res) => {

    // Checking that no user with that username exists
    User.findOne({ emailUsername: req.body.emailUsername }, function (err, user) {
        if (err)
            return res.status(500).send({ message: err.message || "Some error occurred while retriving users" });

        if (user)
            return res.status(409).send({ message: "User with that username already exists" });

        // Creating the user
        const hashedPassword = bcrypt.hashSync(req.body.password, 10);
        const user = new User(req.body);
        user.password = hashedPassword;
        user.role = "user";

        user.save(function (err) {
            if (err)
                return res.status(500).send("There was a problem registrating the user");

            // returning a token
            const token = jwt.sign({ id: user.emailUsername, role: "user" }, config.secret, { expiresIn: 86400 });
            res.status(201).send({ auth: true, token });
        });
    });
};

// Check login info and return login status
exports.login = (req, res) => {

    // Find the user and validate the password
    User.findOne({ emailUsername: req.body.emailUsername }, function (err, user) {
        if (err)
            return res.status(500).send('Error on the server');
        if (!user)
            return res.status(403).json('Username incorrect');

        const passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
        if (!passwordIsValid)
            return res.status(401).send({ auth: false, token: null, message: "Invalid password" });

        const token = jwt.sign({ id: user.emailUsername, role: user.role }, config.secret, { expiresIn: 86400 });
        res.status(200).send({ emailUsername: user.emailUsername, firstname : user.firstname, lastname : user.lastname, auth: true, token });
    });
};