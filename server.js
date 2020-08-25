
const mongoose = require("mongoose");
const express = require('express');
const Question = require("./QuestionModel");
const User = require("./UserModel");
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const app = express();

const store = new MongoDBStore({
	uri: 'mongodb://localhost/quiztracker',
	collection: 'sessiondata'
  });

// sets cookie to expire in 100000 milliseconds
app.use(session({secret: 'some secret', store: store, cookie: {maxAge: 100000}}));

// routes
app.set("view engine", "pug");
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(express.json());
app.get('/users', getUsers);
app.get("/users/:userID", loadSingleUser);
app.post("/login", login);
app.get('/logout', logout)
app.post("/save", updatePrivacy);

// updates privacy in database to on or off for user
function updatePrivacy(req, res, next){
	User.findOneAndUpdate({username: req.session.username}, {$set:{privacy : req.body.privacy}}, function (err, result){
		if (err) throw err;
		console.log("updated");
	});
};

// logout function that deletes the current session
function logout(req, res, next){
	req.session.destroy(function (err){
		res.redirect("/");
	});
}

// gets array of users who have privacy off, able to display on users page
function getUsers(req, res, next){
	User.find({privacy: false}).lean().exec(function(err, result){
		if (err) throw err;
		res.render('pages/userIndex', {users: result, "session": req.session});
	});
}

// loading single user page
function loadSingleUser(req, res, next){
	let oid;
	let value = req.params.userID;
	User.findOne({_id: value}, function (err, result){
		if (err) throw err;

		// if user is not in database, throw 404
		if (!result){
			res.status(404).send("User ID " + value + " does not exist.");
			return;
		}

		// if user is logged in and their username equals username of url, display extra features
		if (req.session.loggedin){
			if (req.session.username === result.username){
				res.render('pages/user', {user: result, ownprofile: true, "session": req.session});
				return;
			}
		};
		// if user is trying to access ID that is for a private user, throw 403 error
		if (result.privacy){
			res.status(403).render('pages/error');
			return;
		}
		// otherwise, display scores and total quiz number
		res.render('pages/user', {user : result, "session": req.session});
	});

}

// function to verify login creditials are in database
function login(req, res, next){
	// if session is already logged in
	if (req.session.loggedin){
		res.redirect("/");
		return;
	}
	// search in database for entered username and password
	let username = req.body.username;
	let password = req.body.password;
	mongoose.connection.db.collection("users").findOne({username: username, password: password}, function(err, result) {
		if(err)throw err;
		
		// if match is found, render page of profile	
		if(result){
			req.session.loggedin = true;
			req.session.username = username;
			req.session.password = password;
			req.session.userid = result._id;
			res.render('pages/user', {user: result, ownprofile: true, "session": req.session});
		}else{ // otherwise, display main page again
			res.render('pages/index', {"session": req.session});
			return;
		}
	});
}

// default for main page
app.get('/', function(req, res, next) {
	res.render("pages/index", {"session": req.session});
	return;
});


//Returns a page with a new quiz of 10 random questions
app.get("/quiz", function(req, res, next){
	Question.getRandomQuestions(function(err, results){
		if(err) throw err;
		res.status(200).render("pages/quiz", {questions: results, "session": req.session});
		return;
	});
})

//The quiz page posts the results here
//Extracts the JSON containing quiz IDs/answers
//Calculates the correct answers and replies
app.post("/quiz", function(req, res, next){
	let ids = [];
	try{
		//Try to build an array of ObjectIds
		for(id in req.body){
			ids.push(new mongoose.Types.ObjectId(id));
		}
		
		//Find all questions with Ids in the array
		Question.findIDArray(ids, function(err, results){
			if(err)throw err; //will be caught by catch below
			
			//Count up the correct answers
			let correct = 0;
			for(let i = 0; i < results.length; i++){
				if(req.body[results[i]._id] === results[i].correct_answer){
					correct++;
				}
			}
			
			//Send response
			// if logged in and session going
			if (req.session && req.session.loggedin){
				// get values of total quizzes and total score
				User.findOne({username: req.session.username}, function (err, result){
					let totalQuiz = result.total_quizzes;
					let avgScore = result.total_score;
					
					// calculate updated values for the two
					avgScore = ((avgScore * totalQuiz) + correct) / (totalQuiz + 1);
					totalQuiz += 1;

					let link = "http://localhost:3000/users/" + result._id;

					// find user object and update two values, redirect to profile link
					User.findOneAndUpdate({username: req.session.username}, {$set:{total_quizzes : totalQuiz, total_score : avgScore}}, function (err, result){
						if (err) throw err;
						console.log("updated");
						
						res.json({url: link, correct: correct});
						return;
					})
				});
			}
			else{
				// if not logged in, redirect to homepage
				res.json({url: '/', correct: correct});
				return;
			}
		});
	}catch(err){
		//If any error is thrown (casting Ids or reading database), send 500 status
		console.log(err);
		res.status(500).send("Error processing quiz data.");
		return;
	}
	
});

//Connect to database
mongoose.connect('mongodb://localhost/quiztracker', {useNewUrlParser: true});
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	app.listen(3000);
	console.log("Server listening on port 3000");
});