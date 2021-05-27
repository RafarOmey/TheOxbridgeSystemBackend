// let mongoose = require("mongoose");
// let LocationRegistration = require('../models/locationRegistration.js');

// let chai = require('chai');
// let chaiHttp = require('chai-http');
// let server = require('../../server.js'); // our server.js
// let should = chai.should();

// chai.use(chaiHttp);

// const pathToReplayLocations = ('/locationRegistrations/getreplay/');
// const eventId = 2;
// const numberOfLocations = 4;

// describe('GET ALL locationRegistrations on event ' + eventId, () => {
//     it('TEST # 1 - it should GET all the locationRegistrations on event ' + eventId, (done) => {
//       chai.request('http://192.168.1.104:3000')
//           .get(pathToReplayLocations + eventId)
//           .end((err, res) => {
//                 res.should.have.status(200);
//                 res.body.should.be.a('array');
//                 res.body.length.should.be.eql(numberOfLocations);
//             done();
//           });
//     });
// });



