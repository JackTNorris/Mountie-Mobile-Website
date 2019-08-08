const functions = require('firebase-functions');
const admin = require('firebase-admin');

var firebase = require("firebase/app");
//calendar view + 
// Add the Firebase products that you want to use
require("firebase/auth");
require("firebase/firestore");
require('firebase/database');
// Add the Firebase products that you want to use
const firebaseConfig = {
    apiKey: "AIzaSyB_JrcF7ogRqsOo2h9jW0GrA5_vSMCdgLA",
    authDomain: "mountie-mobile.firebaseapp.com",
    databaseURL: "https://mountie-mobile.firebaseio.com",
    projectId: "mountie-mobile",
    storageBucket: "mountie-mobile.appspot.com",
    messagingSenderId: "269099119210",
    appId: "1:269099119210:web:8159a0e2aeab5378"
};

admin.initializeApp();



var db = admin.database();
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var ref = db.ref('/events');

var cookieParser = require('cookie-parser');
var aRef = db.ref('/announcements');

var userRefThing = db.ref('/appusers');


let registrationTokens = [];

exports.tokenUpdater = userRefThing.on("child_added", (snapshot, prevChildKey) => {
    let g = snapshot.val();
    console.log(g.info.token)
    registrationTokens.push(g.info.token);
});



// See the "Defining the message payload" section below for details
// on how to define a message payload.


/*
ref.child('event2').set({
    name: "RHS FootBall vs Heritage",
    date: 'August 20, 2019 17:30:00',
    location: "FootballField",
    info: "First golf match of the year"
});
ref2.child('event2').set({
    name: "RHS Golf vs Heritage",
    date: 'August 18, 2019 17:30:00',
    location: "Lost Springs Golf Course",
    info: "First golf match of the year"
});
ref3.child('event3').set({
    name: "RHS Golf vs Heritage",
    date: 'August 18, 2019 17:30:00',
    location: "Lost Springs Golf Course",
    info: "First golf match of the year"
});
ref4.child('event4').set({
    name: "RHS Golf vs Heritage",
    date: 'August 18, 2019 17:30:00',
    location: "Lost Springs Golf Course",
    info: "First golf match of the year"
});
*/
app.use(cookieParser()); //allows me to parse the request for cookie data with the cookieParse middleware
app.use(bodyParser.urlencoded({ extended: true })); //allows me to parse the req variable body as a javascript object



app.get('/testing', (req, res) => {
    res.send("<h1>What up boi</h1>")

});

app.post('/deleteAnnouncement', (req, res) => {
    if (req.cookies.__session) {
        admin.auth().verifyIdToken(req.cookies.__session.toString())
            .then((decodedToken) => {
                db.ref('/announcements/' + req.body.announcementPath.toString()).remove();
                res.redirect('/home');
                return "";
            })
            .catch((error) => {
                res.send("ERROR MOFO");
                res.redirect('/login');
            });
    } else {
        res.redirect('/login');
        //res.send("You don't have a cookie mofo");
    }



});


app.get('/dacronjobyo', (req, res) => {
    console.log("Cron Job Ran Dude!!!");
    let specificNotificationTokens = [];
    let eventRef = db.ref('/events');
    eventRef.once('value', (dataSnapshot) => {
        dataSnapshot.forEach((category) => { //this loop loops through each category
            category.forEach((event) => { //this loop loops through each event
                let today = new Date();
                today.setHours(today.getHours() - 5); //this adjusts things so that this function executes @ 12:00 CDT
                let tempDate = new Date(event.val().date);
                today.setDate(today.getDate() + 1); //in essence, after this step, the today var is now one day after today
                if (today.getMonth() === tempDate.getMonth() && today.getDate() === tempDate.getDate()) {
                    let eventCategory = event.val().category;
                    let eventActivity = event.val().activity;
                    let appUsersRef = db.ref('/appusers');
                    appUsersRef.once('value', (snapshot) => {
                        let usersToSendTo = [];
                        snapshot.forEach((user) => {
                            if (user.val().notificationsPreferences) {
                                let notifArray = []; //a boolean array of all the types of activities the student wants to be notified of
                                let eventTypes = [];
                                switch (eventCategory) {
                                    case 'athletics':
                                        eventTypes = [
                                            'Baseball',
                                            'Football',
                                            'Basketball',
                                            'Bowling',
                                            'Golf',
                                            'Track and Field',
                                            'Cross Country',
                                            'Tennis',
                                            'Wrestling',
                                            'Volleyball',
                                            'Soccer',
                                            'Cheer/Competitive Dance', //had to shorten this from Cheer/Competitive dance b/c this is what I have in the DB
                                        ];
                                        user.val().notificationsPreferences.athleticsNotif.forEach((item) => {

                                            notifArray.push(item);
                                        })
                                        break;
                                    case 'arts':
                                        eventTypes = ['Choir', 'Orchesra', 'Band', 'Drama', 'Theatre Dance'];
                                        user.val().notificationsPreferences.artsNotif.forEach((item) => {
                                            notifArray.push(item);
                                        })
                                        break;
                                    case 'academics':
                                        eventTypes = ['Tutoring', 'ACT', 'SAT', 'Assembly'];
                                        user.val().notificationsPreferences.academicsNotif.forEach((item) => {
                                            notifArray.push(item);
                                        })
                                        break;
                                    case 'miscellaneous':
                                        eventTypes = ['Pep Rally', 'School Dance', 'Club Meeting'];
                                        user.val().notificationsPreferences.miscellaneousNotif.forEach((item) => {
                                            notifArray.push(item);
                                        });
                                        break;
                                    default:
                                        break;
                                }
                                eventTypes.sort();
                                for (let i = 0; i < eventTypes.length; i++) {
                                    if (eventTypes[i].toLowerCase() === eventActivity && notifArray[i] === true) {
                                        //left off here
                                        usersToSendTo.push(user.key);
                                    }
                                }
                            }
                        }); //end of foreach

                        let payload = {
                            notification: {
                                title: event.val().name + " " + "Tommorrow at " + tempDate.getHours() + ":" + tempDate.getMinutes(),
                                body: event.val().description //payload is the second argument of send to device, it contains notificaiotn and other settings
                            }
                        }
                        if (usersToSendTo.length > 0) {
                            admin.messaging().sendToDevice(usersToSendTo, payload).then(() => {
                                console.log("All devices have been notified!");
                                console.log("Date I think is today: " + new Date().toString());
                                return "";
                            }).catch((error) => {
                                console.log(error.message);
                            });
                        }


                    }); //
                }
            })
        })
    })
    res.end();
})

app.get('/createAnnouncement', (req, res) => {
    if (req.cookies.__session) {
        admin.auth().verifyIdToken(req.cookies.__session.toString())
            .then((decodedToken) => {
                res.sendfile(__dirname + '/html/createAnnouncement.html');
                return "";
            })
            .catch((error) => {
                console.log(error.message);
                res.redirect('/login');
            });
    } else {
        res.redirect('/login');
        //res.send("You don't have a cookie mofo");
    }

});

app.post('/createAnnouncement', (req, res) => {

    if (req.cookies.__session) {
        //Delete later
        var payload = {
            notification: {
                title: 'New Announcement',
                body: req.body.message.toString()
            }
        };
        admin.auth().verifyIdToken(req.cookies.__session).then(() => {
                let newAnnouncementRef = db.ref('/announcements').push();
                newAnnouncementRef.set({
                    message: req.body.message.toString(),
                    dateEntered: new Date().getTime()
                });
                return admin.messaging().sendToDevice(registrationTokens, payload);
            }).then(() => {
                res.redirect('/home');
                return "";
            })
            .catch((error) => {
                console.log(error.message);
                res.redirect('/login');
            });
    } else {
        res.redirect('/login');
    }


})

app.post('/editEvent', (req, res) => {
    if (req.cookies.__session) {
        admin.auth().verifyIdToken(req.cookies.__session).then(() => {
                let updateRef = db.ref('/events/' + req.body.category);
                let today = new Date();
                let timeString = "";
                db.ref('/events/' + req.body.ogCategory + '/' + req.body.ogName).remove();

                if (!(req.body.time.toString() === "" || req.body.time.toString() === null)) {
                    timeString += "T" + req.body.time.toString();
                }

                return updateRef.child(cleanse4FB(req.body.name.toString())).set({
                    name: req.body.name.toString(),
                    category: req.body.category.toString(),
                    activity: req.body.activity.toString(),
                    date: req.body.date.toString() + timeString,
                    location: req.body.location.toString(),
                    //time: req.body.eventTime.toString(),
                    isSpecial: (req.body.isSpecial) ? true : false,
                    description: req.body.description.toString(),
                    updatedOn: today.toDateString()
                });
            })
            .then(() => {
                res.redirect('/home');
                return "";
            })
            .catch((error) => {
                res.send(error.message);
                res.redirect('/login');
            })
    } else {
        res.redirect('/login');
    }



});



app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/html/login.html');

});


app.get('/viewQueue', (req, res) => {
    if (req.cookies.__session) {
        admin.auth().verifyIdToken(req.cookies.__session.toString())
            .then((decodedToken) => {
                //res.send("CONGRATS, YOU ADMIN BRUH");
                renderQueue(res, decodedToken);
                return "";
            })
            .catch((error) => {
                console.log(error.message);
                res.redirect('/login');
            })
    } else {
        res.redirect('/login');
    }
});

app.post('/viewQueue', (req, res) => {
    let eventToApprove = null;
    db.ref('/eventQueue').once('value', (dataSnapshot) => {
            dataSnapshot.forEach((item) => {
                if (item.val().name === req.body.eventName) {
                    eventToApprove = item.val();
                }
            });
        }).then(() => {
            if (eventToApprove) {
                switch (req.body.eventAction) {
                    case "approve":
                        db.ref('/events/' + eventToApprove.category).child(cleanse4FB(req.body.eventName)).set({
                            name: eventToApprove.name,
                            category: eventToApprove.category,
                            activity: eventToApprove.activity,
                            date: eventToApprove.date,
                            location: eventToApprove.location,
                            //time: req.body.eventTime.toString(),
                            isSpecial: (eventToApprove.isSpecial) ? true : false,
                            description: eventToApprove.description,
                            updatedOn: eventToApprove.updatedOn
                        })
                        db.ref('/eventQueue/' + cleanse4FB(eventToApprove.name)).remove();
                        break;
                    case "reject":
                        db.ref('/eventQueue/' + cleanse4FB(req.body.eventName)).remove();
                        break;
                    default:
                        break;
                }
            }
            return "";
        }).then(() => {
            res.redirect('/viewQueue');
            return "";
        })
        .catch((error) => {
            console.log(error.message);
        })
        /*
    
        */

})


app.post('/deleteEvent', (req, res) => {
    if (req.cookies.__session) {
        admin.auth().verifyIdToken(req.cookies.__session).then(() => {
                var deleteRef = db.ref('/events/' + req.body.ogCategory + '/' + cleanse4FB(req.body.ogName));
                return deleteRef.remove();
            })
            .then(() => {
                res.redirect('/home');
                return "";
            })
            .catch(() => {
                res.redirect('/login');
            })
    } else {
        res.redirect('/login');
    }


})

var cleanse4FB = function(key) {
    let finalString = "";
    for (let i = 0; i < key.length; i++) {
        if (!(key.charAt(i) === '.' || key.charAt(i) === '$')) {
            finalString += key.charAt(i);
        }
    }


    return finalString;
}


app.get('/addEvent', (req, res) => {
    if (req.cookies.__session) {
        admin.auth().verifyIdToken(req.cookies.__session.toString())
            .then((decodedToken) => {
                res.sendFile(__dirname + "/html/addEvent.html")
                return "";
            })
            .catch((error) => {
                res.send("ERROR MOFO");
            });
    } else {
        res.redirect('/login');
        //res.send("You don't have a cookie mofo");
    }


});





app.post('/viewEvent', (req, res) => {
    if (req.cookies.__session) {
        admin.auth().verifyIdToken(req.cookies.__session).then((decodedToken) => {
            renderEventView(res, req.body.event2view, decodedToken);
            return "";
        }).catch((error) => {
            console.log(error.message);
            res.redirect('/login');
        })
    } else {
        res.redirect('/login');
    }
});



app.get('/home', (req, res) => {
    if (req.cookies.__session) {
        admin.auth().verifyIdToken(req.cookies.__session.toString())
            .then((decodedToken) => {
                renderHome(res, decodedToken);
                return "";
            })
            .catch((error) => {
                res.redirect('/login');
            })
    } else {
        res.redirect('/login');
    }
});


app.post('/login', (req, res) => {
    //this part of my code receives the idToken passed to it from the front end. it then validates it and stores it in a cookie
    admin.auth().verifyIdToken(req.body.authToken.toString())
        .then((decodedToken) => {
            //var uid = decodedToken.uid;
            //console.log(uid);
            var expDate = new Date();

            res.cookie("__session", req.body.authToken, { //cookie must be named __session, or firebase won't let it pass through http for parsing
                maxAge: 360000 //makes cookie expire in 1 hr, which is this many milliseconds

            });

            // res.set('Set-Cookie', `__session=${req.body.authToken.toString()};`) //cookie must be named session, or firebase won't let it pass through
            //res.send("SUCCESS BOOOOOOOOIIIIIIII!" + "\n" + req.cookies.userToken.toString());

            res.redirect('/home')


            return decodedToken;
        })
        .catch((error) => {
            // Handle error
            res.send("Invalid Cookie");

            console.log(error.message);
        });
});

app.post('/addEvent', (req, res) => {
    admin.auth().verifyIdToken(req.cookies.__session.toString()) //function that verifies my id token
        .then((decodedToken) => {
            var today = new Date();
            let uidIsAdmin = false;
            db.ref('/adminUsers').once('value', (dataSnapshot) => {
                if (dataSnapshot.hasChild(decodedToken.uid)) {
                    ref = db.ref('/events/' + req.body.eventCategory.toString());
                } else {
                    ref = db.ref('/eventQueue');
                }

                let checkTime = '';
                if (req.body.eventTime.toString() !== '' && req.body.eventTime.toString() !== null) {
                    checkTime = 'T' + req.body.eventTime.toString();
                }
                ref.child(cleanse4FB(req.body.eventName.toString())).set({
                    name: req.body.eventName.toString(),
                    category: req.body.eventCategory.toString(),
                    activity: req.body.eventActivity.toString(),
                    date: req.body.eventDate.toString() + checkTime,
                    location: req.body.location.toString(),
                    //time: req.body.eventTime.toString(),
                    description: req.body.eventDescription.toString(),
                    isSpecial: (req.body.isSpecial) ? true : false,
                    updatedOn: today.toDateString()
                });
            })


            renderHome(res, decodedToken);
            //res.end();
            return decodedToken;
        })
        .catch((error) => {
            res.redirect('/login');
            console.log(error.message);
        });
});


//posts data from a database from the http POST request

/*
app.post('/home', (req, res) => {

    switch (req.body.typePost.toString()) {
        case 'fromLogin': //this part of my code receives the idToken passed to it from the front end. it then validates it and stores it in a cookie
            admin.auth().verifyIdToken(req.body.authToken.toString())
                .then((decodedToken) => {
                    //var uid = decodedToken.uid;
                    //console.log(uid);
                    var expDate = new Date();

                    res.cookie("__session", req.body.authToken, { //cookie must be named __session, or firebase won't let it pass through http for parsing
                        maxAge: 360000 //makes cookie expire in 1 hr, which is this many milliseconds

                    });

                    // res.set('Set-Cookie', `__session=${req.body.authToken.toString()};`) //cookie must be named session, or firebase won't let it pass through
                    //res.send("SUCCESS BOOOOOOOOIIIIIIII!" + "\n" + req.cookies.userToken.toString());

                    res.redirect('/home')


                    return decodedToken;
                })
                .catch((error) => {
                    // Handle error
                    res.send("Invalid Cookie");

                    console.log(error.message);
                });

            break;


        case 'fromAddEvent':
            admin.auth().verifyIdToken(req.cookies.__session.toString()) //function that verifies my id token
                .then((decodedToken) => {
                    var today = new Date();
                    let uidIsAdmin = false;
                    db.ref('/adminUsers').once('value', (dataSnapshot) => {
                        if (dataSnapshot.hasChild(decodedToken.uid)) {
                            ref = db.ref('/events/' + req.body.eventCategory.toString());
                        } else {
                            ref = db.ref('/eventQueue');
                        }

                        let checkTime = '';
                        if (req.body.eventTime.toString() !== '' && req.body.eventTime.toString() !== null) {
                            checkTime = 'T' + req.body.eventTime.toString();
                        }
                        ref.child(cleanse4FB(req.body.eventName.toString())).set({
                            name: req.body.eventName.toString(),
                            category: req.body.eventCategory.toString(),
                            activity: req.body.eventActivity.toString(),
                            date: req.body.eventDate.toString() + checkTime,
                            location: req.body.location.toString(),
                            //time: req.body.eventTime.toString(),
                            description: req.body.eventDescription.toString(),
                            isSpecial: (req.body.isSpecial) ? true : false,
                            updatedOn: today.toDateString()
                        });
                    })


                    renderHome(res, decodedToken);
                    //res.end();
                    return decodedToken;
                })
                .catch((error) => {
                    res.redirect('/login');
                    console.log(error.message);
                });
            break;
        default:
            res.redirect('/login');
            break;
    }
*/

/*
ref = db.ref('/events/' + req.body.eventCategory.toString());
ref.child(req.body.eventName.toString()).set({
    name: req.body.eventName.toString(),
    category: req.body.eventCategory.toString(),
    activity: req.body.eventActivity.toString(),
    date: req.body.eventDate.toString(),
    time: req.body.eventTime.toString(),
    description: req.body.eventDescription.toString()
})
res.send('hello');

});
*/





var renderHome = function(res, decodedToken) {
    var eventList = [];
    var athleticEvents = [];
    var academicEvents = [];
    var miscellaneousEvents = [];
    var artsEvents = [];
    var announcements = [];
    var announcementPaths = [];
    let uid = decodedToken.uid;
    let uidIsAdmin = false;
    var athleticsRef = db.ref('/events/athletics').orderByChild('date');
    var artsRef = db.ref('/events/arts').orderByChild('date');
    var academicsRef = db.ref('/events/academics').orderByChild('date');
    var miscellaneousRef = db.ref('/events/miscellaneous').orderByChild('date');
    var adminUsersRef = db.ref('/adminUsers');

    var announcementsRef = db.ref('/announcements').orderByChild('dateEntered');
    let checkUID = adminUsersRef.once('value', (snapshot) => {
        uidIsAdmin = snapshot.hasChild(uid);
    });

    let getAnnouncements = announcementsRef.once('value', (data) => {
        data.forEach((element) => {
            announcements.unshift(element.val());
            announcementPaths.unshift(element.key.toString());
            console.log(element.key.toString());
        })
    })
    let getArts = artsRef.once("value", (data) => {
        data.forEach((element) => {
            artsEvents.push(element.val());
        })
    })
    let getAcademics = academicsRef.once("value", (data) => {
            data.forEach((element) => {
                academicEvents.push(element.val());
            })

        }) //
    let getMiscellaneous = miscellaneousRef.once("value", (data) => {
            data.forEach((element) => {
                miscellaneousEvents.push(element.val());
            })

        }) //

    let getAthletics = athleticsRef.once("value", (data) => {
            data.forEach((element) => {
                athleticEvents.push(element.val());
            })

        }) //

    Promise.all([getAnnouncements, getAcademics, getArts, getMiscellaneous, getAthletics, checkUID])
        .then(() => {
            if (uidIsAdmin) {
                console.log("This user is an administrator");
            } else {
                console.log("Not an administrator");
            }
            res.write("<!DOCTYPE html>");
            res.write("<html>");
            res.write("<head>");
            res.write("<title>Mountie Mobile | Home</title>");
            res.write("<style>\n");
            res.write("        h1 {\n");
            res.write("            color: blue;\n");
            res.write("            text-align: center;\n");
            res.write("        }\n");
            res.write("\n");
            res.write("        #currentEventsTitle {\n");
            res.write("            text-align: center;\n");
            res.write("            font-size: 50px;\n");
            res.write("            font-family: Verdana, Geneva, Tahoma, sans-serif;\n");
            res.write("        }\n");
            res.write("\n");
            res.write("        #add-event-button {\n");
            if (uidIsAdmin) {
                res.write("             float: right;");

            } else {
                res.write("            right: 0;position: absolute;\n");
            }
            res.write("        }\n");
            res.write("\n");
            res.write("        #create-announcement-button {\n");
            res.write("            float: left;\n");
            res.write("        }\n");
            res.write("\n");
            res.write("        #topMenu {\n");
            res.write("            margin: auto;\n");
            res.write("            background-color: blue;\n");
            res.write("        }\n");
            res.write("\n");
            res.write("        table {\n");
            res.write("            width: 800px;\n");
            res.write("        }\n");
            res.write("\n");
            res.write("        th {\n");
            res.write("            text-align: center;\n");
            res.write("            border-bottom: 2px solid black;\n");
            res.write("            border-top: 1px solid black;\n");
            res.write("        }\n");
            res.write("\n");
            res.write("        tr {\n");
            res.write("            text-align: center;\n");
            res.write("        }\n");
            res.write("\n");
            res.write("        tr.even {\n");
            res.write("            background-color: lightblue;\n");
            res.write("        }\n");
            res.write("\n");
            res.write("        tr:hover {\n");
            res.write("            color: blue;\n");
            res.write("            cursor: pointer;\n");
            res.write("            width: 1000px;\n");
            res.write("        }\n");
            res.write("\n");
            res.write("#eventList {\n");
            res.write("text-align: center;\n");
            res.write("padding-bottom: 60px;\n");
            res.write("border-bottom: 2px solid black;\n");
            res.write("}\n");
            res.write("\n");
            res.write(".deleteAnnouncementButtons { background-color: white}");


            res.write("        #catSelect {\n");
            res.write("            text-align: center;\n");
            res.write("        }\n");
            res.write("\n");
            res.write("        li {\n");
            res.write("            display: inline-block;\n");
            res.write("            margin-right: 50px;\n");
            res.write("            margin-left: 50px;\n");
            res.write("            margin-bottom: 50px;\n");
            res.write("        }\n");
            res.write("\n");
            res.write("        li#academicFilter {\n");
            res.write("            margin-left: 0px;\n");
            res.write("        }\n");
            res.write("\n");
            res.write("        .filterButtons {\n");
            res.write("            width: 100px;\n");
            res.write("            height: 100px;\n");
            res.write("            transition: all .3s ease-in-out;\n");
            res.write("            transform: scale(1);\n");
            res.write("            outline: 0;\n");
            res.write("        }\n");
            res.write("\n");
            res.write("        .filterButtons#academicsFilter {\n");
            res.write("            width: 120px;\n");
            res.write("            height: 120px;\n");
            res.write("        }\n");
            res.write("\n");
            res.write("        .filterButtons#artsFilter {\n");
            res.write("            width: 120px;\n");
            res.write("            height: 120px;\n");
            res.write("        }\n");
            res.write("\n");
            res.write("        .filterButtons#athleticsFilter {\n");
            res.write("            padding-bottom: 10px;\n");
            res.write("        }\n");
            res.write("\n");
            res.write("        .filterButtons:hover {\n");
            res.write("            transform: scale(1.5);\n");
            res.write("        }\n");

            res.write("#announcementsTitle {\n");
            res.write("text-align: center;\n");
            res.write("font-size: 50px;\n");
            res.write("font-family: Verdana, Geneva, Tahoma, sans-serif;\n");
            res.write("}\n");
            res.write("\n");
            res.write(".even.announcements {\n");
            res.write("background-color: rgba(11, 218, 11, 0.544);\n");
            res.write("}\n");
            res.write("\n");
            res.write("#announcementList {\n");
            res.write("margin-bottom: 100px;\n");
            res.write("}\n");
            res.write("\n");
            res.write("#storeEliminateButton {\n");
            res.write("background-color: white;\n");
            res.write("width: 30px;\n");
            res.write("border-bottom: 0px;\n");
            res.write("border-top: 0px;\n");
            res.write("}\n");
            res.write("\n");
            res.write("#deleteAnnouncementButton:hover {\n");
            res.write("-webkit-filter: invert() sepia() saturate(8000%) drop-shadow(3px 3px 5px red);\n");
            res.write("}\n");
            res.write("\n");
            res.write("tr.announcements:hover {\n");
            res.write("color: black;\n");
            res.write("}\n");
            res.write("\n");
            res.write("tr.announcements:hover {\n");
            res.write("cursor: auto;\n");
            res.write("}\n");
            res.write("#adminLink{ text-align: right }")
            res.write("    </style>\n");
            res.write("\n");
            res.write("<script>\n");

            res.write("var deleteAnnouncement = function(announcementMessage) {\n");
            res.write("    let x = document.getElementById(\"deleteAnnouncementForm\");\n");
            res.write("    let g = document.getElementById(\"deleteAnnouncementPath\");\n");
            res.write("    g.setAttribute('value', announcementMessage);\n");
            res.write("    x.submit();\n");
            res.write("}\n");




            res.write("var e;\n");
            res.write("window.onload = function() {e = document.getElementById('eventViewer'); document.getElementById('academicsFilter').style.webkitFilter = \"invert() sepia() saturate(8000%) drop-shadow(3px 3px 5px blue)\";}\n");
            res.write("var viewEvent = function(input) {var t = document.getElementsByName('event2view')[0];\nt.value = input.getAttribute(\"value\");\ne.submit();}\n");
            res.write("        var writeEventTable = function(filtButton) {\n");
            res.write("            setAllBlack();\n");
            res.write("            var sE = document.getElementById('spawnedEvents');\n");
            res.write("            sE.innerHTML = \"<tr class='even'>           <th>Event</th>           <th>Category</th>           <th>Location</th>           <th>Date & Time</th>       </tr>\";\n");
            res.write("            switch (filtButton.getAttribute('id')) {\n");
            res.write("                case 'academicsFilter':\n");
            res.write("                    filtButton.style.webkitFilter = \"invert() sepia() saturate(8000%) drop-shadow(3px 3px 5px blue)\";\n");


            for (let i = 1; i <= academicEvents.length; i++) {
                //let aDate = new Date(eventList[i-1].date.toString());
                res.write("sE.innerHTML += \"<tr");
                if (i % 2 === 0) {
                    res.write(" class = 'even' ");
                }

                res.write(" onclick='viewEvent(this)'" + " value=" + "\\\"" + cleanseInput(academicEvents[i - 1].name.toString(), true) + "\\\"" + ">");

                res.write("<td>" + cleanseInput(academicEvents[i - 1].name.toString()) + "</td>");
                res.write("<td>" + academicEvents[i - 1].category.toString() + "</td>");
                res.write("<td>" + academicEvents[i - 1].location.toString() + "</td>");
                res.write("<td>" + academicEvents[i - 1].date.toString() + "</td>");
                res.write("</tr>\";\n");
            }



            res.write("                    break;\n");
            res.write("                case 'artsFilter':\n");
            res.write("                    filtButton.style.webkitFilter = \"invert() sepia() saturate(8000%) drop-shadow(3px 3px 5px blue)\";\n");


            for (let i = 1; i <= artsEvents.length; i++) {
                //let aDate = new Date(eventList[i-1].date.toString());
                res.write("sE.innerHTML += \"<tr");
                if (i % 2 === 0) {
                    res.write(" class = 'even' ");
                }

                res.write(" onclick='viewEvent(this)'" + " value=" + "\\\"" + cleanseInput(artsEvents[i - 1].name.toString(), true) + "\\\"" + ">");

                res.write("<td>" + cleanseInput(artsEvents[i - 1].name.toString()) + "</td>");
                res.write("<td>" + artsEvents[i - 1].category.toString() + "</td>");
                res.write("<td>" + artsEvents[i - 1].location.toString() + "</td>");
                res.write("<td>" + artsEvents[i - 1].date.toString() + "</td>");
                res.write("</tr>\";\n");
            }



            res.write("                    break;\n");
            res.write("                case 'athleticsFilter':\n");
            res.write("                    filtButton.style.webkitFilter = \"invert() sepia() saturate(8000%) drop-shadow(3px 3px 5px blue)\";\n");


            for (let i = 1; i <= athleticEvents.length; i++) {
                //let aDate = new Date(eventList[i-1].date.toString());
                res.write("sE.innerHTML += \"<tr");
                if (i % 2 === 0) {
                    res.write(" class = 'even' ");
                }

                res.write(" onclick='viewEvent(this)'" + " value=" + "\\\"" + cleanseInput(athleticEvents[i - 1].name.toString(), true) + "\\\"" + ">");

                res.write("<td>" + cleanseInput(athleticEvents[i - 1].name.toString()) + "</td>");
                res.write("<td>" + athleticEvents[i - 1].category.toString() + "</td>");
                res.write("<td>" + athleticEvents[i - 1].location.toString() + "</td>");
                res.write("<td>" + athleticEvents[i - 1].date.toString() + "</td>");
                res.write("</tr>\";\n");
            }



            res.write("                    break;\n");
            res.write("                case 'miscellaneousFilter':\n");
            res.write("                    filtButton.style.webkitFilter = \"invert() sepia() saturate(8000%) drop-shadow(3px 3px 5px blue)\";\n");


            for (let i = 1; i <= miscellaneousEvents.length; i++) {
                //let aDate = new Date(eventList[i-1].date.toString());
                res.write("sE.innerHTML += \"<tr");
                if (i % 2 === 0) {
                    res.write(" class = 'even' ");
                }

                res.write(" onclick='viewEvent(this)'" + " value=" + "\\\"" + cleanseInput(miscellaneousEvents[i - 1].name.toString(), true) + "\\\"" + ">");

                res.write("<td>" + cleanseInput(miscellaneousEvents[i - 1].name.toString()) + "</td>");
                res.write("<td>" + miscellaneousEvents[i - 1].category.toString() + "</td>");
                res.write("<td>" + miscellaneousEvents[i - 1].location.toString() + "</td>");
                res.write("<td>" + miscellaneousEvents[i - 1].date.toString() + "</td>");
                res.write("</tr>\";\n");
            }



            res.write("                    break;\n");
            res.write("            }\n");
            res.write("        }\n");
            res.write("\n");
            res.write("\n");
            res.write("        var setAllBlack = function() {\n");
            res.write("            let filtButtons = document.getElementsByClassName('filterButtons');\n");
            res.write("            for (let i = 0; i < filtButtons.length; i++) {\n");
            res.write("                filtButtons[i].style.webkitFilter = '';\n");
            res.write("            }\n");
            res.write("        }\n");
            res.write("    </script>\n");
            res.write("<head>");
            res.write("");
            res.write("");
            res.write("");
            res.write("<body>");
            res.write("");
            res.write("<h1 id=\"logo\"><img src=\"./images/websiteLogo.png\" width=\"823\" class=\"topStuff\" /></h1>");
            res.write("");
            res.write("<div id=\"buttons\">");
            if (uidIsAdmin) {
                res.write("   <form method = 'GET' action = '/createAnnouncement' id=\"create-announcement-button\" class=\"topStuff\">");
                res.write("       <input type=\"image\" src=\"./images/create-announcement-button.png\" width=\"200\" class=\"topStuff\" />");
                res.write("   </form>");
            }


            res.write("   <form method=\"GET\" action=\"/addEvent\" id=\"add-event-button\" class=\"topStuff\">");
            res.write("       <input type=\"image\" src=\"./images/addEventButton.png\" width=\"200\" />");
            res.write("   </form>");
            res.write("</div>");
            res.write("</br>");
            res.write("<h2 id=\"currentEventsTitle\">Events</h2>");
            res.write("");
            res.write("<div id=\"catSelect\">\n");
            res.write("    <ul>\n");
            res.write("        <li id=\"academicFilter\"><input type=\"image\" onclick=\"writeEventTable(this)\" src=\"./images/academicsFilter.png\" id=\"academicsFilter\" class=\"filterButtons\" /><p>Academics</p></li>\n");
            res.write("        <li><input type=\"image\" onclick=\"writeEventTable(this)\" src=\"./images/artsFilter.png\" id=\"artsFilter\" class=\"filterButtons\" /><p>Arts</p></li>\n");
            res.write("        <li><input type=\"image\" onclick=\"writeEventTable(this)\" src=\"./images/athleticsFilter.png\" id=\"athleticsFilter\" class=\"filterButtons\" /><p>Athletics</p></li>\n");
            res.write("        <li><input type=\"image\" onclick=\"writeEventTable(this)\" src=\"./images/miscellaneousFilter.png\" id=\"miscellaneousFilter\" class=\"filterButtons\" /><p>Miscellaneous</p></li>\n");
            res.write("    </ul>\n");
            res.write("</div>\n");
            res.write("<div id=\"eventList\">");
            res.write("   <table align=\"center\">");

            res.write("\n<tbody id = 'spawnedEvents'>\n");
            res.write("       <tr class=\"even\">");
            res.write("           <th>Event</th>");
            res.write("           <th>Category</th>");
            res.write("           <th>Location</th>");
            res.write("           <th>Date & Time</th>");
            res.write("       </tr>");
            return "";
        })
        .then(() => {

            for (let i = 1; i <= academicEvents.length; i++) {
                //let aDate = new Date(eventList[i-1].date.toString());
                res.write("<tr");
                if (i % 2 === 0) {
                    res.write(" class = 'even' ");
                }

                res.write(" onclick='viewEvent(this)'" + " value=" + "\"" + cleanseInput(academicEvents[i - 1].name.toString(), true) + "\"" + ">");

                res.write("<td>" + cleanseInput(academicEvents[i - 1].name.toString()) + "</td>");
                res.write("<td>" + academicEvents[i - 1].category.toString() + "</td>");
                res.write("<td>" + academicEvents[i - 1].location.toString() + "</td>");
                res.write("<td>" + academicEvents[i - 1].date.toString() + "</td>");
                res.write("</tr>");
            }
            res.write("\n</tbody>\n");

            res.write("</table>");
            res.write("</div>");
            res.write("<form method='POST' action='/viewEvent' id='eventViewer'>");
            res.write("<input type='hidden' name='event2view' value='' />");
            res.write("</form>");

            res.write("<h2 id=\"announcementsTitle\">Announcements</h2>\n");


            res.write("<div id='announcementList'>\n");
            res.write("    <table align=\"center\">\n");
            res.write("        <tr class='even announcements'>\n");
            res.write("            <th>Announcement</th>\n");

            if (uidIsAdmin) {
                res.write("            <th id=\"storeEliminateButton\"></th>\n");
            }

            res.write("        </tr>\n");


            for (let i = 1; i <= announcements.length; i++) {
                res.write("<tr");
                if (i % 2 === 0) {
                    res.write(" class = 'even announcements' ");
                } else {
                    res.write(" class = 'announcements' ");
                }
                res.write(">");
                res.write("<td>" + announcements[i - 1].message.toString() + "</td>");
                if (uidIsAdmin) {
                    res.write("<td class = 'deleteAnnouncementButtons'><input onClick = \"deleteAnnouncement('" + announcementPaths[i - 1] + "')\"" + " id='deleteAnnouncementButton' type='image' src='./images/deleteButton.png' width='15px'/></td>");
                }
                res.write("</tr>");
            }

            res.write("\n");
            res.write("    </table>\n");
            res.write("</div>\n");
            if (uidIsAdmin) {
                res.write('<a href="/viewQueue">\n');
                res.write('<p id="adminLink">For Administrators</p>\n');
                res.write(' </a>\n');
            }


            res.write("<form type = \"hidden\" method = \"POST\" action = \"/deleteAnnouncement\" id = \"deleteAnnouncementForm\">\n");
            res.write("    <input type = \"hidden\" name = \"announcementPath\" value = \"\" id = \"deleteAnnouncementPath\"/>\n");
            res.write("\n");
            res.write("</form>\n");
            res.write("</body>");
            res.write("");
            res.write("</html>");



            return "";
        })
        .then(() => {
            res.end();
            return "";
        })
        .catch((error) => {
            console.log(error);
        });

}

var renderQueue = function(res, decodedToken) {

    let uidIsAdmin = false; //using this boolen to determine if the user is an adminstrator
    let eventQueue = [];
    let announcementQueue = [];
    let announcementQueueKeys = [];
    let uidVerificationPromise = db.ref('/adminUsers').once('value', (dataSnapshot) => { //js api that checks if user is admin using hasChild function
        if (dataSnapshot.hasChild(decodedToken.uid)) {
            uidIsAdmin = true;
        } else {
            res.redirect('/home');
        }
    });
    let announcementQueuePromise = db.ref('/eventQueue').orderByChild('dateEntered').once('value', (dataSnapshot) => {
        dataSnapshot.forEach((announcement) => {
            announcementQueue.push(announcement.val());
            announcementQueueKeys.push(announcement.key);
        })
    });
    let eventQueuePromise = db.ref('/eventQueue').orderByChild('updatedOn').once('value', (dataSnapshot) => {
        dataSnapshot.forEach((event) => {
            eventQueue.push(event.val())
        })
    });

    Promise.all([uidVerificationPromise, eventQueuePromise, announcementQueuePromise]).then(() => {
        res.write("<!DOCTYPE html>\n");
        res.write("<html>\n");
        res.write("<title>Mountie Mobile | Queue</title>\n");
        res.write("\n");
        res.write("<head>\n");
        res.write("    <style>\n");
        res.write("        body {\n");
        res.write("            margin: none;\n");
        res.write("        }\n");
        res.write("\n");
        res.write("        h1 {\n");
        res.write("            color: blue;\n");
        res.write("            text-align: center;\n");
        res.write("        }\n");
        res.write("\n");
        res.write("        #currentEventsTitle {\n");
        res.write("            text-align: center;\n");
        res.write("            font-size: 50px;\n");
        res.write("            font-family: Verdana, Geneva, Tahoma, sans-serif;\n");
        res.write("        }\n");
        res.write("\n");
        res.write("        table {\n");
        res.write("            width: 800px;\n");
        res.write("        }\n");
        res.write("\n");
        res.write("        th {\n");
        res.write("            text-align: center;\n");
        res.write("            border-bottom: 2px solid black;\n");
        res.write("            border-top: 1px solid black;\n");
        res.write("        }\n");
        res.write("\n");
        res.write("        tr {\n");
        res.write("            text-align: center;\n");
        res.write("        }\n");
        res.write("\n");
        res.write("        tr.even {\n");
        res.write("            background-color: rgba(209, 232, 0, 0.544);\n");
        res.write("        }\n");
        res.write("\n");
        res.write("        tr:hover {\n");
        res.write("            cursor: pointer;color: blue\n");
        res.write("        }\n");
        res.write("\n");
        res.write("        tr.announcements:hover {\n");
        res.write("            cursor: auto;\n");
        res.write("        }\n");
        res.write("\n");
        res.write("        #eventList {\n");
        res.write("            text-align: center;\n");
        res.write("            padding-bottom: 60px;\n");
        res.write("            border-bottom: 2px solid black;\n");
        res.write("        }\n");
        res.write("\n");
        res.write("        li#academicFilter {\n");
        res.write("            margin-left: 0px;\n");
        res.write("        }\n");
        res.write("\n");
        res.write("        .filterButtons {\n");
        res.write("            width: 100px;\n");
        res.write("            height: 100px;\n");
        res.write("            transition: all .3s ease-in-out;\n");
        res.write("            transform: scale(1);\n");
        res.write("            outline: 0;\n");
        res.write("        }\n");
        res.write("\n");
        res.write("        .filterButtons#academicsFilter {\n");
        res.write("            width: 120px;\n");
        res.write("            height: 120px;\n");
        res.write("        }\n");
        res.write("\n");
        res.write("        .filterButtons#artsFilter {\n");
        res.write("            width: 120px;\n");
        res.write("            height: 120px;\n");
        res.write("        }\n");
        res.write("\n");
        res.write("        .filterButtons#athleticsFilter {\n");
        res.write("            padding-bottom: 10px;\n");
        res.write("        }\n");
        res.write("\n");
        res.write("        #eventTable {\n");
        res.write("            padding-bottom: 100px;\n");
        res.write("            border-bottom: 10px solid black;\n");
        res.write("        }\n");
        res.write("\n");
        res.write("        #announcementsTitle {\n");
        res.write("            text-align: center;\n");
        res.write("            font-size: 50px;\n");
        res.write("            font-family: Verdana, Geneva, Tahoma, sans-serif;\n");
        res.write("        }\n");
        res.write("\n");
        res.write("        .even.announcements {\n");
        res.write("            background-color: rgba(235, 180, 52, 0.544);\n");
        res.write("        }\n");
        res.write("\n");
        res.write("        #announcementList {\n");
        res.write("            margin-bottom: 100px;\n");
        res.write("        }\n");
        res.write("\n");
        res.write("        #storeEliminateButton {\n");
        res.write("            background-color: white;\n");
        res.write("            width: 30px;\n");
        res.write("            border-bottom: 0px;\n");
        res.write("            border-top: 0px;\n");
        res.write("        }\n");
        res.write("\n");
        res.write("        .rejectButton:hover {\n");
        res.write("            -webkit-filter: invert() sepia() saturate(8000%) drop-shadow(3px 3px 5px red);\n");
        res.write("        }\n");
        res.write("\n");
        res.write("        .approveButton:hover {\n");
        res.write("            -webkit-filter: saturate(8000%) drop-shadow(3px 3px 5px green);\n");
        res.write("        }\n");
        res.write("\n");
        res.write("        tr.announcements:hover {\n");
        res.write("            color: black;\n");
        res.write("        }\n");
        res.write("\n");
        res.write("        .sideButtons {\n");
        res.write("            background-color: white;\n");
        res.write("        }\n");
        res.write("\n");
        res.write("        #storeApproveButton {\n");
        res.write("            background-color: white;\n");
        res.write("            width: 30px;\n");
        res.write("            border-bottom: 0px;\n");
        res.write("            border-top: 0px;\n");
        res.write("        }\n");
        res.write("    </style>\n");
        res.write("\n");
        res.write("<script>\n");
        res.write("    var approveEvent = function(component){\n");
        res.write("        let verifyEventForm = document.getElementById('adminVerifyEvent');\n");
        res.write("        let eventName = document.getElementsByName('eventName')[0];\n");
        res.write("        let eventAction = document.getElementsByName('eventAction')[0];\n");
        res.write("        eventName.setAttribute('value', component.getAttribute('value'));\n");
        res.write("        eventAction.setAttribute('value', 'approve');\n");
        res.write("        verifyEventForm.submit()\n");
        res.write("    }\n");
        res.write("\n");
        res.write("    var rejectEvent = function(component){\n");
        res.write("        let verifyEventForm = document.getElementById('adminVerifyEvent');\n");
        res.write("        let eventName = document.getElementsByName('eventName')[0];\n");
        res.write("        let eventAction = document.getElementsbyName('eventAction')[0];\n");
        res.write("        eventName.setAttribute('value', component.getAttribute('value'));\n");
        res.write("        eventAction.setAttribute('value', 'reject');\n");
        res.write("        verifyEventForm.submit()\n");
        res.write("    }\n");
        res.write("</script>\n");
        res.write("</head>\n");
        res.write("\n");
        res.write("\n");
        res.write("\n");
        res.write("<body>\n");
        res.write("\n");
        res.write("<h1 id=\"logo\"><img src=\"./images/websiteLogo.png\" width=\"823\" class=\"topStuff\" /></h1>\n");
        res.write("\n");
        res.write("</br>\n");
        res.write("<h2 id='currentEventsTitle'>Potential Events</h2>\n");
        res.write("\n");
        res.write("\n");
        res.write("<div id='eventList'>\n");
        res.write("    <table align=\"center\">\n");
        res.write("        <tr class='even'>\n");
        res.write("            <th>Event</th>\n");
        res.write("            <th>Category</th>\n");
        res.write("            <th>Activity</th>\n");
        res.write("            <th>Location</th>\n");
        res.write("            <th>Date & Time</th>\n");
        res.write("\n");
        res.write("        </tr>\n");
        eventQueue.forEach((event) => {
            res.write("        <tr title=\"" + cleanseInput(event.description, true) + "\"  class=\"data\">\n");
            res.write("            <td>" + event.name + "</td>\n");
            res.write("            <td>" + event.category + "</td>\n");
            res.write("            <td>" + event.activity + "</td>\n");

            res.write("            <td>" + event.location + "</td>\n");
            res.write("            <td>" + event.date + "</td>\n");
            res.write("            <td class=\"sideButtons\"><input onclick = 'approveEvent(this)' value = \"" + cleanseInput(event.name, true) + "\" class=\"approveButton\" type=\"image\" src=\"./images/approveButton.png\" width='15px' /></td>\n");
            res.write("            <td class=\"sideButtons\"><input  onclick = 'rejectEvent(this)' class=\"rejectButton\" type=\"image\" src=\"./images/deleteButton.png\" width='15px' /></td>\n");
            res.write("        </tr>\n");
        })

        res.write("\n");
        res.write("    </table>\n");
        res.write("</div>\n");
        res.write("\n");
        res.write("\n");
        res.write("\n");
        res.write("\n");
        res.write("\n");
        res.write("\n");
        res.write("\n");
        res.write("\n");
        res.write("\n");
        res.write("\n");
        res.write("\n");
        res.write("\n");
        res.write("\n");
        res.write("<form method = \"POST\" action = \"/viewQueue\" id = \"adminVerifyEvent\" >\n");
        res.write("    <input  type = \"hidden\" value = \"\" name = \"eventName\"/>\n");
        res.write("    <input  type = \"hidden\" value = \"\" name = \"eventAction\"/>\n");
        res.write("</form>\n");
        res.write("</body>\n");
        res.write("\n");
        res.write("</html>\n");

        return "";
    }).then(() => {
        res.end();
        return "";
    }).catch((error) => {
        console.log(error.message);
    })

}





var renderEventView = function(res, eventName, decodedToken) {
    ref = db.ref('/events');
    var allEvents;
    let uidIsAdmin = false;
    let retrieveEventsPromise = ref.once('value', (snapshot) => {
        allEvents = snapshot;
    })
    let checkUIDPromise = db.ref('/adminUsers').once('value', (snapshot) => {
        if (snapshot.hasChild(decodedToken.uid)) {
            uidIsAdmin = true;
        }
    })
    Promise.all([retrieveEventsPromise, checkUIDPromise]).then(() => {
            allEvents.forEach((item) => {
                item.forEach((thing) => {
                    let chosenEvent = thing.val();
                    if (chosenEvent.name === eventName) { //this is the line
                        res.write("<!DOCTYPE html>\n");
                        res.write("<html>\n");
                        res.write("\n");
                        res.write("<head>\n");
                        res.write("    <title>Mountie Mobile | View Event</title>\n");
                        res.write("    <style>\n");
                        res.write("        #logo {\n");
                        res.write("            text-align: center;\n");
                        res.write("        }\n");
                        res.write("\n");
                        res.write("        h1 {\n");
                        res.write("            text-align: center;\n");
                        res.write("        }\n");
                        res.write("\n");
                        res.write("        h2 {\n");
                        res.write("            text-align: center;\n");
                        res.write("        }\n");
                        res.write("\n");
                        res.write("        #delete-event-button {\n");
                        res.write("            float: right;\n");
                        res.write("        }\n");
                        res.write("\n");
                        res.write("        #edit-event-button {\n");
                        res.write("            float: left;\n");
                        res.write("        }\n");
                        res.write("\n");
                        res.write("        #eventTitle {\n");
                        res.write("            font-size: 40px;\n");
                        res.write("            position: static;\n");
                        res.write("        }\n");
                        res.write("\n");
                        res.write("        .eventData {\n");
                        res.write("            font-size: 20px;\n");
                        res.write("            padding-left: 40px;\n");
                        res.write("        }\n");
                        res.write("\n");
                        res.write("        .inputData#date {\n");
                        res.write("            background-color: white;\n");
                        res.write("        }\n");
                        res.write("\n");
                        res.write("        .inputData#description {\n");
                        res.write("            width: 400px;\n");
                        res.write("            height: 100px;\n");
                        res.write("            resize: none;\n");
                        res.write("        }\n");
                        res.write("\n");
                        res.write("        .inputData {\n");
                        res.write("            border-width: 0;\n");
                        res.write("            outline: 0;\n");
                        res.write("            font-size: 15px;\n");
                        res.write("            color: black;\n");
                        res.write("        }\n");
                        res.write("\n");
                        res.write("        .editButton {\n");
                        res.write("            width: 15px;\n");
                        res.write("        }\n");
                        res.write("\n");
                        res.write("        input#makeChangesButton {\n");
                        res.write("            width: 150px;\n");
                        res.write("            border-color: blue;\n");
                        res.write("            border-radius: 10px;\n");
                        res.write("            transition: width 1s;\n");
                        res.write("        }\n");
                        res.write("\n");
                        res.write("        input#makeChangesButton:hover {\n");
                        res.write("            width: 200px;\n");
                        res.write("        }\n");
                        res.write("\n");
                        res.write("        #name-change {\n");
                        res.write("            display: none;\n");
                        res.write("        }\n");


                        res.write("        .inputData#time {background-color: white;}\n");

                        res.write("    </style>\n");
                        res.write("\n");
                        res.write("    <script>\n");
                        res.write("        var inputData = [];\n");
                        res.write("        window.onload = function() {\n");
                        res.write("            inputData = document.getElementsByClassName('inputData');\n");
                        res.write("            writeActivityBox();\n");
                        res.write("            setSelectedActivity('" + chosenEvent.activity.toString() + "');\n");
                        res.write("        }\n");
                        res.write("\n");

                        if (uidIsAdmin) {
                            res.write("        var makeEventsEditable = function() {\n");
                            res.write("            for (let i = 0; i < inputData.length; i++) {\n");
                            res.write("                inputData[i].style.borderWidth = '1px';\n");
                            res.write("                inputData[i].style.outline = '1';\n");
                            res.write("                inputData[i].disabled = false;\n");
                            res.write("                inputData[i].readOnly = false;\n");
                            res.write("            }\n");
                            res.write("            var z = document.getElementById('makeChangesButton');\n");
                            res.write("            z.hidden = false;\n");
                            res.write("            var x = document.getElementById('name-change');\n");
                            res.write("\n");
                            res.write("\n");
                            res.write("            x.style.display = \"initial\"\n");
                            res.write("\n");
                            res.write("        }\n");



                            res.write("\n");
                            res.write("        var confirmDeletion = function() {\n");
                            res.write("            // eslint-disable-next-line no-alert\n");
                            res.write("            var cD = confirm(\"Are you sure you want to delete this event?\");\n");
                            res.write("            if (cD) {\n");
                            res.write("                var d = document.getElementById('delete-event-form');\n");
                            res.write("                d.submit();\n");
                            res.write("            }\n");
                            res.write("\n");
                            res.write("        }\n");
                            res.write("\n");


                            res.write("        var validateForm = function() {\n");
                            res.write("\n");
                            res.write("            var requiredData = document.getElementsByClassName('required');\n");
                            res.write("            var alertedOnce = false;\n");
                            res.write("            for (var i = 0; i < requiredData.length; i++) {\n");
                            res.write("                requiredData[i].style.borderColor = \"gray\";\n");
                            res.write("                //console.log(inputData[i].value);\n");
                            res.write("                if (requiredData[i].value === null || requiredData[i].value === \"\") {\n");
                            res.write("\n");
                            res.write("                    requiredData[i].style.borderColor = \"red\";\n");
                            res.write("                    if (!alertedOnce) {\n");
                            res.write("                        // eslint-disable-next-line no-alert\n");
                            res.write("                        alert(\"Make Sure you fill in all required data\");\n");
                            res.write("                        alertedOnce = true;\n");
                            res.write("                    }\n");
                            res.write("\n");
                            res.write("\n");
                            res.write("                }\n");
                            res.write("            }\n");
                            res.write("            if (!alertedOnce) {\n");
                            res.write("                var makeChangesForm = document.getElementById('makeChangesForm');\n");
                            res.write("                makeChangesForm.submit();\n");
                            res.write("            }\n");
                            res.write("\n");
                            res.write("\n");
                            res.write("        }\n");
                        }

                        res.write("\n");
                        res.write("        var setSelectedActivity = function(selectedActivity) {\n");
                        res.write("            var allOpts = document.getElementsByTagName('option');\n");
                        res.write("\n");
                        res.write("            for (let i = 0; i < allOpts.length; i++) {\n");
                        res.write("                if (allOpts[i].value === selectedActivity) {\n");
                        res.write("                    allOpts[i].selected = true;\n");
                        res.write("                }\n");
                        res.write("            }\n");
                        res.write("        }\n");
                        res.write("\n");
                        res.write("        var writeActivityBox = function(firstTime) {\n");
                        res.write("\n");
                        res.write("            var thing2 = document.getElementById(\"activity\");\n");
                        res.write("            //thing2.innerHTML = \"<option style=\\\"display:none\\\">\";\n");
                        res.write("            switch (document.getElementById(\"category\").value) {\n");
                        res.write("                case \"athletics\":\n");
                        res.write("                    thing2.innerHTML = \"<option value= \\\"baseball\\\">Baseball</option>\" +\n");
                        res.write("                        \"<option value= \\\"basketball\\\">Basketball</option>\" +\n");
                        res.write("                        \"<option value= \\\"bowling\\\">Bowling</option>\" +\n");
                        res.write("                        \"<option value= \\\"cross country\\\">Cross Country</option>\" +\n");
                        res.write("                        \"<option value= \\\"football\\\">Football</option>\" +\n");
                        res.write("                        \"<option value= \\\"golf\\\">Golf</option>\" +\n");
                        res.write("                        \"<option value= \\\"track and field\\\">Track and Field</option>\" +\n");
                        res.write("                        \"<option value= \\\"tennis\\\">Tennis</option>\" +\n");
                        res.write("                        \"<option value= \\\"volleyball\\\">Volleyball</option>\" +\n");
                        res.write("                        \"<option value= \\\"wrestling\\\">Wrestling</option>\" +\n");
                        res.write("                        \"<option value= \\\"soccer\\\">Soccer</option>\" +\n");
                        res.write("                        \"<option value= \\\"cheer/competitive dance\\\">Cheer/Competitive Dance</option>\" +\n");
                        res.write("                        \"<option value= \\\"other\\\">Other</option>\";\n");
                        res.write("\n");
                        res.write("                    break;\n");
                        res.write("                case \"arts\":\n");
                        res.write("                    thing2.innerHTML =\n");
                        res.write("                        \"<option value= \\\"orchestra\\\">Orchestra</option>\" +\n");
                        res.write("                        \"<option value= \\\"band\\\">Band</option>\" +\n");
                        res.write("                        \"<option value= \\\"drama\\\">Drama</option>\" +\n");
                        res.write("                        \"<option value= \\\"choir\\\">Choir</option>\" +\n");
                        res.write("                        \"<option value= \\\"theatre dance\\\">Theatre Dance</option>\" +\n");
                        res.write("                        \"<option value= \\\"other\\\">Other</option>\";\n");
                        res.write("                    break;\n");
                        res.write("                case \"academics\":\n");
                        res.write("                    thing2.innerHTML =\n");
                        res.write("                        \"<option value= \\\"tutoring\\\">Tutoring</option>\" +\n");
                        res.write("                        \"<option value= \\\"ACT\\\">ACT</option>\" +\n");
                        res.write("                        \"<option value= \\\"SAT\\\">SAT</option>\" +\n");
                        res.write("                        \"<option value = \\\"assembly\\\">Assembly</option>\" +\n");
                        res.write("                        \"<option value= \\\"other\\\">Other</option>\";\n");
                        res.write("                    break;\n");
                        res.write("                case \"miscellaneous\":\n");
                        res.write("                    thing2.innerHTML =\n");
                        res.write("                        \"<option value= \\\"school dance\\\">School Dance</option>\" +\n");
                        res.write("                        \"<option value= \\\"pep rally\\\">Pep Rally</option>\" +\n");
                        res.write("                        \"<option value= \\\"club meeting\\\">Club Meeting</option>\" +\n");
                        res.write("                        \"<option value= \\\"other\\\">Other</option>\";\n");
                        res.write("                    break;\n");
                        res.write("            }\n");
                        res.write("\n");
                        res.write("\n");
                        res.write("        }\n");
                        res.write("    </script>\n");
                        res.write("</head>\n");
                        res.write("\n");
                        res.write("\n");
                        res.write("<body>\n");
                        res.write("<h1 id=\"logo\"><img src=\"./images/websiteLogo.png\" width=\"823px\" /></h1>\n");
                        if (uidIsAdmin) {
                            res.write("<form method=\"POST\" id=\"delete-event-form\" action=\"/deleteEvent\" hidden=\"true\">\n");
                            res.write("<input type = 'hidden' name = 'ogName' value = \"" + cleanseInput(chosenEvent.name.toString(), true) + "\"/>")
                            res.write("<input type = 'hidden' name = 'ogCategory' value = \"" + chosenEvent.category.toString() + "\"/>")

                            res.write("</form>\n");

                            res.write("<input type=\"image\" id=\"delete-event-button\" src=\"./images/delete-event-button.png\" width=\"200px\" onclick=\"confirmDeletion()\" />\n");


                            res.write("<input onclick=\"makeEventsEditable()\" id=\"edit-event-button\" type=\"image\" src=\"./images/edit-event-button.png\" width=\"200px\" />\n");

                        }
                        res.write("\n");
                        res.write("<h1 id=\"eventTitle\">" + chosenEvent.name.toString() + "</h1>\n");
                        res.write("</br>\n");
                        res.write("</br>\n");
                        res.write("\n");
                        res.write("\n");
                        res.write("\n");
                        res.write("\n");

                        if (uidIsAdmin) {
                            res.write("<form id=\"makeChangesForm\" method=\"POST\" action=\"/editEvent\">\n");
                            res.write("<input name = 'ogName' type = 'hidden' value = \"" + cleanseInput(chosenEvent.name.toString(), true) + "\"/>");
                            res.write("<input name = 'ogCategory' type = 'hidden' value = \"" + chosenEvent.category.toString() + "\"/>");
                            res.write("    <div id=\"name-change\">\n");
                            res.write("        <h3>Changed Event Name:</h3>\n");
                            res.write("        <span class=\"eventData\">\n");
                            res.write("                            <input value = \"" + cleanseInput(chosenEvent.name.toString(), true) + "\" id=\"name\"  name = \"name\" type=\"text\" class=\"inputData required\" />\n");
                            res.write("                    </span>\n");
                            res.write("\n");
                            res.write("    </div>\n");
                        }

                        res.write("\n");
                        res.write("\n");
                        res.write("    <h3>Category: </h3>\n");
                        res.write("\n");
                        res.write("\n");
                        res.write("    <span class=\"eventData\">\n");
                        res.write("                    <select  name = \"category\"  class=\"inputData required\" disabled=true id = \"category\" onchange = \"writeActivityBox()\">\n");
                        res.write("                        <option value = \"athletics\" " + (chosenEvent.category.toString() === 'athletics' ? "selected" : " ") + ">Athletics</option>\n");
                        res.write("                        <option value = \"arts\" " + (chosenEvent.category.toString() === 'arts' ? "selected" : " ") + ">Arts</option>\n");
                        res.write("                        <option value = \"miscellaneous\" " + (chosenEvent.category.toString() === 'miscellaneous' ? "selected" : " ") + ">Miscellaneous</option>\n");
                        res.write("                        <option value = \"academics\"  " + (chosenEvent.category.toString() === 'academics' ? "selected" : " ") + ">Academics</option>\n");
                        res.write("                    </select>\n");
                        res.write("                </span>\n");
                        res.write("\n");
                        res.write("\n");
                        res.write("\n");
                        res.write("    </br>\n");
                        res.write("\n");
                        res.write("\n");
                        res.write("    <h3>Activity: </h3>\n");
                        res.write("\n");
                        res.write("    <span class=\"eventData\">\n");
                        res.write("                        <select  name = \"activity\"  class=\"inputData required\" disabled=true id=\"activity\">\n");
                        res.write("                            <option value = \"golf\">Golf</option>\n");
                        res.write("                        </select>\n");
                        res.write("                </span>\n");
                        res.write("\n");
                        res.write("\n");
                        res.write("\n");
                        res.write("    </br>\n");
                        res.write("    <h3>Date: </h3>\n");
                        res.write("\n");
                        res.write("\n");
                        res.write("    <span class=\"eventData\">\n");
                        res.write("                    <input value = " + formatDate(new Date(chosenEvent.date)) + " type = \"date\"  name = \"date\" class = \"inputData required\" id=\"date\" disabled = true/>\n");
                        res.write("                </span>\n");
                        res.write("\n");
                        res.write("\n");
                        res.write("\n");
                        res.write("\n");
                        res.write("    </br>\n");
                        res.write("    <h3>Time: </h3>\n");
                        res.write("\n");
                        res.write("    <span class=\"eventData\">\n");
                        res.write("             <input value = " + (new Date(chosenEvent.date).toTimeString().substring(0, 8)) + " type = \"time\"  name = \"time\" class = \"inputData\" id=\"time\" disabled = true/>\n");
                        res.write("        </span>\n");
                        res.write("\n");
                        res.write("    </br>\n");
                        res.write("    <h3>Location: </h3>\n");
                        res.write("\n");
                        res.write("\n");
                        res.write("    <span class=\"eventData\">\n");
                        res.write("                        <input value = " + chosenEvent.location.toString() + " type = \"text\"  name = \"location\" class = \"inputData\" readonly=\"true\" value=\"locationPlace\"/>\n");
                        res.write("                </span>\n");
                        res.write("\n");
                        res.write("\n");
                        res.write("\n");
                        res.write("    </br>\n");
                        res.write("    <h3>Description: </h3>\n");
                        res.write("    <span class=\"eventData\">\n");
                        res.write("                       <textarea class = \"inputData\" name = \"description\" id = \"description\" readonly = true>" + chosenEvent.description.toString() + "</textarea>\n");
                        res.write("                </span>\n");
                        res.write("<h3>Special Event?:  <input type = \"checkbox\" class = \"inputData\" disabled = true name = \"isSpecial\" " + (chosenEvent.isSpecial ? "checked" : "") + " /> </h3>")
                        res.write("\n</br>\n")
                        if (uidIsAdmin) {
                            res.write("</form>\n");

                        }
                        res.write("\n");
                        res.write("\n");

                        res.write("\n");
                        res.write("\n");
                        res.write("\n");
                        res.write("</br>\n");

                        res.write("<h3>Updated On: </h3>\n");
                        if (chosenEvent.updatedOn) {
                            res.write("<p class='eventData'>" + chosenEvent.updatedOn.toString() + "</p>\n");
                        }

                        res.write("</br>\n");
                        if (uidIsAdmin) {
                            res.write("<input id='makeChangesButton' hidden=\"true\" type=\"button\" value=\"Make Changes\" onclick=\"validateForm()\" />\n");
                        }
                        res.write("\n");
                        res.write("</body>\n");
                        res.write("\n");
                        res.write("\n");
                        res.write("</html>\n");

                    }
                });
            });
            return "";
        })
        .then(() => {
            res.end();
            return "";
        })
        .catch((error) => {
            res.redirect('/home');
            console.log(error.message);
        });


}

var cleanseInput = function(input, isValue) {
    var retString = "";

    for (let i = 0; i < input.length; i++) {

        if (input.charAt(i) === "\"") {
            if (isValue) {
                retString += "&quot;";
            } else {
                retString += "\\\"";
            }

        } else if (input.charAt(i) === "\\") {
            if (isValue) {
                retString += "&bsol;";
            } else {
                retString += "\\\\";
            }

        } else {
            retString += input.charAt(i);
        }
    }

    return retString;
}


function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}













exports.app = functions.https.onRequest(app); //exports this as my nodeJs backend, so now crap worksys
/*
exports.scheduledFunctionPlainEnglish =
functions.pubsub.schedule('every 2 minutes').onRun((context) => {
    console.log('This will be run every 2 minutes!');
});
*/