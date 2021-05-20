module.exports = (app) => {
    const eventRegistrations = require('../controllers/eventRegistration.controller.js');

    // Create a new EventRegistration
    app.post('/eventRegistrations/', eventRegistrations.create);

    // Retrieve all EventRegistrations
    app.get('/eventRegistrations/', eventRegistrations.findAll);

    // Retrieve all EventRegistrations with ship that is owned by user registrered on token
    app.get('/eventRegistrations/findEventRegFromUsername/:eventId', eventRegistrations.findEventRegFromUsername);

    // Create an EventRegistration
    app.post('/eventRegistrations/signUp', eventRegistrations.signUp)

    // Delete an EventRegistration with given eventRegId
    app.delete('/eventRegistrations/:eventRegId', eventRegistrations.delete);

    // Creates an EventRegistration
    app.post('/eventRegistrations/addParticipant', eventRegistrations.addParticipant);

    // Retrieve all EventRegistrations with the given eventId
    app.get('/eventRegistrations/getParticipants/:eventId', eventRegistrations.getParticipants);

    // Update EventRegistration
    app.put('/eventRegistrations/updateParticipant/:eventRegId', eventRegistrations.updateParticipant);
}