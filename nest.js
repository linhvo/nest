var Firebase = require("firebase");
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/simplisafe');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

var nestToken = process.env.NEST_TOKEN

var fb = new Firebase('wss://developer-api.nest.com');
fb.auth(nestToken);


function firstChild(object) {
    for(var key in object) {
        return object[key];
    }
}

fb.on('value', function (snapshot) {
    var data = snapshot.val();
    // For simplicity, we only care about the first
    // thermostat in the first structure
    structure = firstChild(data.structures);
    thermostat = structure.away;

    console.log(structure);
})