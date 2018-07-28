var http = require('http');
var Firebase = require("firebase");
var mongoose = require('mongoose');

var uristring = process.env.MONGOLAB_URI ||'mongodb://localhost/simplisafe';
mongoose.connect(uristring, function (err, res) {
    if (err) {
        console.log ('ERROR connecting to: ' + uristring + '. ' + err);
    } else {
        console.log ('Succeeded connected to: ' + uristring);
    }
});

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

        if(user !== null){
            var nest_status = user.nest_status;
            if (nest_status == 'home' && thermostat == 'away'){
                user.nest_status = "away";
                user.save();
                console.log('Status is changed to Away');
                var options = {
                    host: process.env.SIMPLISAFE_URL,
                    port: process.env.SIMPLINEST_PORT,
                    path: '/simplisafe/away'
                };
                //http.get(options, function(res) {
                //    console.log(options.host);
                //    console.log("Got response: " + res.statusCode);
                //}).on('error', function(e) {
                //        console.log(options);
                //        console.log("Got error: " + e.message);
                //        console.log( e.stack );
                //    });

            } else if(nest_status == 'away' && thermostat == 'home'){
                user.nest_status = 'home';
                console.log('Status is changed to Home');
            } else {
                console.log(thermostat + ' is setting')
            }
        }
    });
    console.log(user);
});
