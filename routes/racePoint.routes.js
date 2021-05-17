module.exports = (app) => {
    const racePoint = require('../controllers/racePoint.controller.js');

    // Retrieve start and finish racepoints from an specific event
    app.get('/racePoints/findStartAndFinish/:eventId', racePoint.findStartAndFinish); 

    // Retrieve all racepoints from an specific event
    app.get('/racepoints/fromEventId/:eventId', racePoint.findAllEventRacePoints); 

    // Creates a new route of racepoints for an event
    app.post('/racepoints/createRoute/:eventId', racePoint.createRoute); 
}