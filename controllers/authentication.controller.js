var jwt = require('jsonwebtoken');
var config = require('../config/config');

exports.Authorize = (req, res, role, callback) => 
{
    // Checks if a token is provided
    var token = req.headers['x-access-token'];
    if(!token) 
        return callback(res.status(401).send({auth: false, message: 'No token provided'}));
    
    // Verifying the token
    jwt.verify(token, config.secret, function(err, decoded){
        if(err) 
            return callback(res.status(500).send({auth:false, message: 'Failed to authenticate token'}));

        //Verifying that the request is allowed by the requesting role
        if(role === "admin" && decoded.role !== "admin")
            return callback(res.status(401).send({auth: false, message: 'Not authorized'}));
            
        return callback(null, decoded);
    });
    
}
    



