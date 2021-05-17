//BASE FOR THE SERVER (importing libaries)
var express = require('express');

var app = express();

const cors = require('cors');
app.use(cors());

var mongoose = require('mongoose');
var bodyParser = require('body-parser');

var urlencode = bodyParser.urlencoded({ extended: true });
app.use(express.static('public'));
app.use(bodyParser.json());

mongoose.set('useUnifiedTopology',true);
mongoose.set('useNewUrlParser',true);
mongoose.set('useFindAndModify', false);

//MAKE DB CONNECTION
// mongoose.connect('mongodb+srv://sa:test1234@cluster0-s51g4.azure.mongodb.net/TheOxbridgeSystem?retryWrites=true&w=majority');
mongoose.connect('mongodb://localhost:27017/OxbridgeDB');
//MODELS
var User = require('./models/user');

var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var config = require('./config/config');

//ROUTING
var router = express.Router();

//TO PROCESS THE NEXT REQUEST !!
router.use(function (req, res, next) {
    console.log("recieved a request now, ready for the next");
    next();
});

app.use('/', router);

// Require routes
require('./routes/user.routes.js')(app);
require('./routes/locationRegistration.routes.js')(app);
require('./routes/ship.routes.js')(app);
require('./routes/event.routes.js')(app);
require('./routes/racePoint.routes.js')(app);
require('./routes/eventRegistration.routes.js')(app);

//SERVER START
 app.listen(process.env.PORT || 3000, () => {
     console.log('We are now listening on port 3000 (serverside)');
 });

module.exports = app;

