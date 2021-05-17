module.exports = (app) => {
    const locationRegistrations = require('../controllers/locationRegistration.controller.js');

    // Create a new LocationRegistration
    app.post('/locationRegistrations/', locationRegistrations.create); 

    // Retrieve latest LocationRegistrations from specified event
    app.get('/locationRegistrations/getLive/:eventId', locationRegistrations.getLive); 
 
    // Retrieve all LocationRegistrations from specified event
    app.get('/locationRegistrations/getReplay/:eventId', locationRegistrations.getReplay); 

    // Retrieve scoreboard from specific event
    app.get('/locationRegistrations/getScoreboard/:eventId', locationRegistrations.getScoreboard); 

    // Delete all locationRegistrations with a given eventRegId
    app.delete('/locationRegistrations/deleteFromEventRegId/:eventId', locationRegistrations.deleteFromEventRegId); 


}