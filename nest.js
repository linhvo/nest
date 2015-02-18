var http = require('http');
var Firebase = require("firebase");
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/simplisafe');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

var schema = new mongoose.Schema({ nest_access_token: String, nest_status: String, datetime: Date},{ collection : 'user' });
var User = mongoose.model('User', schema);

var nestToken = process.env.NEST_TOKEN
var fb = new Firebase('wss://developer-api.nest.com');
fb.auth(nestToken);
console.log(nestToken);


function firstChild(object) {
    for(var key in object) {
        return object[key];
    }
}

User.findOne({nest_access_token: nestToken }, function( err, user) {
    if (err) return console.error(err);
    fb.on('value', function (snapshot) {
        var data = snapshot.val();
        // For simplicity, we only care about the first
        // thermostat in the first structure
        var structure = firstChild(data.structures);
        var thermostat = structure.away;
        var nest_status = user.nest_status;
        if (nest_status == 'home' && thermostat == 'away'){
            user.nest_status = "away";
            user.save();
            console.log('Status now changed to Away');
            var options = {
                host: 'www.simplinest.herokuapp.com',
                port: 80,
                path: '/simplisafe/away'
            };

            http.get(options, function(res) {
                console.log("Got response: " + res.statusCode);
            }).on('error', function(e) {
                    console.log("Got error: " + e.message);
                });
            
        } else if(nest_status == 'away' && thermostat == 'home'){
            user.nest_status = 'home';
            console.log('Status now changed to Home');
        } else {
            console.log('Nothing changes!')
        }
    });
    console.log(user);
});