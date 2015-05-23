//BASE SETUP

//CALL THE PACKAGES-----------------------
var express 	= require('express');
var app			= express();
var bodyParser 	= require('body-parser');
var morgan		= require('morgan');
var mongoose	= require('mongoose');
var port		= process.env.PORT || 2580;
var apiRouter 	= express.Router();
var	User 		= require('./app/models/user');
var jwt			= require('jsonwebtoken');
var superSecret = "ithinkthatyoushouldreallycheckyourselfb$4uR3ckY0urs3lF";
//APP CONFIGURATION
//use body parser so we can grab information from POST requests
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

//configure our app to handle CORS requests
app.use(function(req, res, next){
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, \Authorization');
	
	next();
});

//log all requests to the console
app.use(morgan('dev'));

//basic route for the home page
app.get('/', function(req, res){
	res.send('Welcome to the home page');
	
});

apiRouter.post('/authenticate', function(req, res){
	//find the user
	//select the name username and password explicitly
	User.findOne({
		username: req.body.username
	}).select('name username password').exec(function(err, user){
		
		
		if(err) throw err;
		
		if(!user){
			res.json({
				success: false,
				message: "Authentication failed. User not found."
			})
		}else if(user){
			//check if password matches
			var validPassword = user.comparePassword(req.body.password);
			if(!validPassword){
				res.json({
					
					success: false,
					message: 'Authentication failed. Wrong password.'
					
				});
			}else{
				//if user is found and password is right
				//create a token
				var token = jwt.sign({
					
					name: user.name,
					username: user.username
					
				}, superSecret, {
					expiresInMinutes: 1440 //expires in 24 hours
				});
				
				//return the informaiton including token as JSON
				res.json({
					sucess: true,
					message: "Enjoy your token!",
					token:token
				});
			}
		}
		
		
		
	});
});

apiRouter.get('/', function(req, res){
	res.json({message:'horray! Welcome to our API!'});
});


app.listen(port);
console.log('Magic happens on port ' + port);


mongoose.connect('mongodb://localhost:27017/test');

apiRouter.use(function(req, res, next){
	//do logging
	//console.log('Somebody just came ontu our app!');
	
	//we'll add more to the middleware in chapter 10
	//this is where we will authenticate users
	
	//next(); //make sure we go to next routes and dont stop here
	var token = req.body.token || req.query.token || req.headers['x-access-token'];
	
	//decode token
	if(token){
		
		jwt.verify(token, superSecret, function(err, decoded){
			
			if(err){
				return res.status(403).send({
					success: false,
					message: 'Failed to authenticate token.'
				});
				
			}else{
				
				//if everything is good, save to request for use in other routes
				req.decoded = decoded;
				
				next();
				
				
			}
		});	
	
	}else{
		//if there is no token
		//return an HTTP response of 403 (access forbidden) and an error message
		return res.status(403).send({
			success: false,
			message: 'No token provided'
		});
	}		
		
	
});

apiRouter.get('/', function(req, res){
	res.json({message:"hooray! welcome to our api!"});
	
});

//more routes for our API will happen here.

//REGISTER OUR ROUTES
//all of our routes will be prefixed with /api

app.use('/api', apiRouter);

apiRouter.route('/users')

	.post(function(req, res){
		
		var user = new User();
		
		//set the users information (comes from request)
		user.name = req.body.name;
		user.username = req.body.username;
		user.password = req.body.password;
		
		//save the user and check for errors
		user.save(function(err){
			if(err){
				if(err.code == 11000)
					return res.json({success:false, message: 'A user with that username already exists. '});
				else
					return res.send(err);
			}
				
			
			res.json({message:'User created'});
			
			
		});
		
	})
	
	.get(function(req, res){
		
		User.find(function(err, users){
			if(err) res.send(err);
			
			//return the users
			res.json(users);
		});
		
	});
	
	
apiRouter.route('/users/:user_id')

	//get the user with that id
	// (accessed at GET http://localhost:8000/api/users/:user_id
	.get(function(req, res){
		User.findById(req.params.user_id, function(err, user){
			if(err) res.send(err);
			
			//return that user
			res.json(user);
		});
	})
	
	.put(function(req, res){
		
		//use our model to find the user we want.
		User.findById(req.params.user_id, function(err, user){
			
			if(err) res.send(err);
			
			//update the users only if its new
			if(req.body.name) user.name = req.body.name;	
			if(req.body.username) user.username = req.body.username;
			if(req.body.password) user.password = req.body.password;
			
			//save the user
			user.save(function(err){
				if(err) res.send(err);
				
				//return a message
				res.json({message: "User Updated."});
			});
		});
		
	})
	
	.delete(function(req, res){
		User.remove({
			_id: req.params.user_id
		}, function(err, user){
			if(err) return res.send(err);
			
			res.json({message: 'Succesfully deleted'});
			
		});
	});
	
	