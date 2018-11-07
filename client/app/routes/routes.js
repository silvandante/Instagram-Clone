module.exports = function(application){

	application.get('/postagem/:id', function(req, res){
		application.app.controllers.postagem.postagem(application, req, res);
	});

	//handle login
	let passport = require("../models/passport.js")(application);

	application.get('/dashboard', isLoggedIn, function(req, res){
	  	res.render('home/dashboard.ejs', {
	   		user:req.user
	  	});
	});

	application.get('/profile', isLoggedIn, function(req, res){
	  	res.render('home/profile.ejs', {
	   		user:req.user
	  	});
	});

	application.get('/profile_id/:id', isLoggedIn, function(req, res){
		if (req.params.id == req.user.username) {
			res.redirect("/profile");
		} else {
		  	res.render('home/profile_id.ejs', {
		  		profiler : req.params.id,
		   		user:req.user
		  	});
	  	}
	});

	application.get('/my_followers/', isLoggedIn, function(req, res){

		  	res.render('home/my_followers.ejs', {
		  		profiler : req.params.id,
		   		user:req.user
		  	});
	  
	});

	application.get('/my_following/', isLoggedIn, function(req, res){
		  	res.render('home/my_followings.ejs', {
		  		profiler : req.params.id,
		   		user:req.user
		  	});
	  	
	});


	application.get('/post/:id', isLoggedIn, function(req, res){
		if (req.params.id == req.user.username) {
			res.redirect("/profile");
		} else {
		  	res.render('home/post.ejs', {
		  		profiler : req.params.id,
		   		user:req.user
		  	});
	  	}
	});

	application.get('/followers/:username', isLoggedIn, function(req, res){
		if (req.params.id == req.user.username) {
			res.redirect("/my_followers");
		} else {
		  	res.render('home/followers.ejs', {
		  		profiler : req.params.username,
		   		user:req.user
		  	});
	  	}
	});

	application.get('/following/:username', isLoggedIn, function(req, res){
		if (req.params.id == req.user.username) {
			res.redirect("/my_following");
		} else {
		  	res.render('home/following.ejs', {
		  		profiler : req.params.username,
		   		user:req.user
		  	});
	  	}
	});

	application.get('/profile_edit', isLoggedIn, function(req, res){
	  	res.render('home/profile_edit.ejs', {
	   		user:req.user
	  	});
	});


	application.get('/search_user/:id', isLoggedIn, function(req, res){
	  	res.render('home/search_user.ejs', {
	   		user:req.user
	  	});
	});


	application.get('/post_photo', isLoggedIn, function(req, res){
	  	res.render('home/post_photo.ejs', {
	   		user:req.user
	  	});
	});

	application.get('/', function(req, res){
		if (req.user) {
			res.redirect('/dashboard');
		} else {
			res.render('index/login.ejs', {message: req.flash('loginMessage')});
		}
	});

	application.get('/login', function(req, res){
		if (req.user) {
			res.redirect('/dashboard');
		} else {
			res.render('index/login.ejs', {message: req.flash('loginMessage')});
		}
	});


	application.post('/login', passport.authenticate('local-login', {
		successRedirect: '/dashboard',
	  	failureRedirect: '/login',
	  	failureFlash: true
	}),
		function(err,req, res){
	   		if(req.body.remember){
	    		req.session.cookie.maxAge = 1000 * 60 * 3;
	   		}else{
	    		req.session.cookie.expires = false;
	   		}
	   		res.redirect('/login');
	});

	application.get('/registre_se', function(req, res){
		if (req.user) {
			res.redirect('/dashboard');
		}
	  	res.render('index/registre_se.ejs', {message: req.flash('signupMessage')});
	});

	application.post('/registre_se', passport.authenticate('local-signup', {
	  	successRedirect: '/dashboard',
	  	failureRedirect: '/registre_se',
	  	failureFlash: true
	}));

	function isLoggedIn(req, res, next){
	 	if(req.isAuthenticated())
	  		return next();

	 	res.redirect('/login');
	}

	application.get('/logout', function(req,res){
			req.logout();
		  	res.redirect('/login');
	});

}