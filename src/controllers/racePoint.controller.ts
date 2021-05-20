const Auth = require('./authentication.controller.js');
const RacePoint = require('../models/racePoint.js');

// Create new racepoints
exports.createRoute = (req, res) => {

    // Checking if authorized
    Auth.Authorize(req, res, "admin", function (err) {
        if (err)
            return err;

        // Deleting all previous racePoints
        RacePoint.deleteMany({ eventId: req.params.eventId }, function (err) {
            if (err)
                return res.status(500).send({ message: err.message || "failed to delete route" })

            else {
                const racePoints = req.body;
                if (Array.isArray(racePoints))
                {
                    RacePoint.findOne({}).sort('-racePointId').exec(function (err, lastRacePoint) {
                        let racepointId;

                        if (err)
                            return res.status(500).send({ message: err.message || "Some error occurred while retriving bikeRacks" });
                        if (lastRacePoint)
                            racepointId = lastRacePoint.racePointId;
                        else
                            racepointId = 1;

                        racePoints.forEach(racePoint => {
                            const racepoint = new RacePoint(racePoint);
                            racepointId = racepointId + 1;
                            racepoint.racePointId = racepointId;

                            // Saving the new racepoint in the DB
                            racepoint.save(function (err) {
                                if (err)
                                    return res.send(err);
                            });
                        });
                    });
                    res.status(201).json(racePoints);
                }
                else
                    return res.status(400).send();
            }
        });
    });
}

// Retrieves all racepoints from an given event
exports.findAllEventRacePoints = (req, res) => {
    RacePoint.find({ eventId: req.params.eventId }, { _id: 0, __v: 0 }, { sort: { racePointNumber: 1 } }, function (err, racePoints) {
        if (err)
            return res.status(500).send({ message: err.message || "Some error occurred while retriving racepoints" });
        return res.status(200).send(racePoints);
    })
}

// Retrieves start and finish racepoints from an given event
exports.findStartAndFinish = (req, res) => {
    RacePoint.find({ eventId: req.params.eventId, $or: [{ type: 'startLine' }, { type: 'finishLine' }]}, { _id: 0, __v: 0 }, function (err, racePoints) {
        if (err)
            return res.status(500).send({ message: err.message || "Some error occurred while retriving racepoints" });
        res.status(200).json(racePoints);
    });
};


