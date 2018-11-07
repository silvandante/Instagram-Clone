var app = require ("./config/server.js");

var http = require('http').createServer(app);
var io = require("socket.io")(http);

io.origins('*:*');

http.listen(8080, function(){
	console.log('Server side instagram_clone_v01 online');
});


io.on('connect', function(socket){
	console.log("socket.id"+socket.id);	
});

io.on('newPhoto', function(){
	console.log("recebeu");	
});

var flatten = require('flat');

var mongodb = require("mongodb");

let db = new mongodb.Db(
		'meu_instagram_clone',
		new mongodb.Server(
			'localhost',
			27017,
			{}),
		{}
	);

let fs = require("fs");

let objectId = require('mongodb').ObjectId;

console.log("HTTP server is listening at port " + 8080);

app.post("/api_post_pic", function(req,res){

	res.setHeader("Access-Control-Allow-Origin","*");

	res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
	res.setHeader('Access-Control-Allow-Credentials', true);

	//allow access control to all applications origins (*)
	var date = new Date();
	var time_stamp = date.getTime();

	var path_origin = req.files.arquivo.path;
	var path_destiny = "./uploads/" + time_stamp + "_" + req.files.arquivo.originalFilename;

	fs.rename(path_origin, path_destiny, function(err){
		if (err){
			res.status(500).json({error: err});
			return;
		} 

		var data = {
			url_imagem: time_stamp + "_" + req.files.arquivo.originalFilename,
			titulo: req.body.titulo,
			date_posted: date,
			username: req.body.username
		}

		db.open( function(err,mongoclient){
			mongoclient.collection('users', function(err,collection){
				collection.find({username : req.body.username}).toArray(function(err,records){
					mongoclient.close();
					
					if (err)
						console.log("err"+err);


					data._idUser = records[0]._id.toHexString();

					db.open( function(err,mongoclient){
						mongoclient.collection('postagem', function(err,collection){
							collection.insert(data, function(err,records){
								if (err){
								res.json({'status': '0'});
								} else {
	
									io.sockets.emit('newPhoto');
									
								
									res.json({'status': '1'});
								}
								mongoclient.close();
							});
						});
					});
				});
			});
		});
	}); 
});

//configura a rotas com express
app.get("/", function(req,res){
	res.send({msg: "Olá"});
});

app.post("/api_post_profile", function(req,res){

	res.setHeader("Access-Control-Allow-Origin","*");
	//allow access control to all applications origins (*)

	var date = new Date();
	var time_stamp = date.getTime();

	var path_origin = req.files.arquivo.path;
	var path_destiny = "./uploads/" + time_stamp + "_" + req.files.arquivo.originalFilename;

	fs.rename(path_origin, path_destiny, function(err){
		if (err){
			res.status(500).json({error: err});
			return;
		} 

		var data = {
			url_imagem: time_stamp + "_" + req.files.arquivo.originalFilename,
			name: req.body.name,
			localizacao: req.body.localizacao,
			bio: req.body.bio
		}

		db.open( function(err,mongoclient){
			mongoclient.collection('users', function(err,collection){
				collection.updateOne({username :req.body.username},
					{$set :{
						url_imagem: time_stamp + "_" + req.files.arquivo.originalFilename,
						name: req.body.name,
						localizacao: req.body.localizacao,
						bio: req.body.bio,
						}
						
					},{upsert:true}, function(err,records){
					if (err){
						console.log(err);
						res.json({'status': '0'});
					} else {
						res.json({'status': '1'});
					}
					mongoclient.close();
				});
			});
		});
	}); 
});



//get all posts do db
app.get("/api_pots", function(req,res){

	res.setHeader("Access-Control-Allow-Origin","*");
	db.open( function(err,mongoclient){
		mongoclient.collection('postagem', function(err,collection){
			collection.find().toArray(function(err,results){
				if (err){
					res.json(err);
				} else {
					res.json(results);
				}
				mongoclient.close();
			});
		});
	});
});



//get all posts by friends do db
app.get("/api_posts_by_friend/:username", function(req,res){

	res.setHeader("Access-Control-Allow-Origin","*");
	db.open( function(err,mongoclient){
		mongoclient.collection('users', function(err,collection){
			collection.find({username: req.params.username}).toArray(function(err,results){
				if (err){
					res.json(err);
				} else {
					mongoclient.close();

					var friends = [];
					if(results[0]._idFollowing != undefined){
					for (var i = 0 ; i < results[0]._idFollowing.length ; i++){
						friends.push(results[0]._idFollowing[i].following);
					}
						db.open( function(err,mongoclient){
						mongoclient.collection('postagem', function(err,collection){
							collection.find({username: {$in: friends}}).sort({date_posted: -1}).toArray(function(err,results){
								if (err){
									res.json(err);
								} else {
									res.json(results);
									
								}
								mongoclient.close();
							});
						});
						});
					}
				}
			});
		});
	});
});

//get all posts by me do db
app.get("/api_posts_by_me/:username", function(req,res){

	res.setHeader("Access-Control-Allow-Origin","*");
	db.open( function(err,mongoclient){
		mongoclient.collection('users', function(err,collection){
			collection.find({username: req.params.username}).toArray(function(err,results){
				if (err){
					mongoclient.close();
					res.json(err);
				} else {

					mongoclient.close();

					if (!isEmpty(results)){
						db.open( function(err,mongoclient){
						mongoclient.collection('postagem', function(err,collection){
							collection.find({_idUser: results[0]._id.toHexString()}).sort({date_posted: -1}).toArray(function(err,results){
								if (err){
									res.json(err);
								} else {
									res.json(results);
									
								}
								mongoclient.close();
							});
						});
						});
					}
				}
			});
		});
	});
});

	function isEmpty(obj) {
    for(var prop in obj) {
	        if(obj.hasOwnProperty(prop))
	            return false;
	    }

	    return true;
	}

//get post by id do db
app.get("/api/:id", function(req,res){
		res.setHeader("Access-Control-Allow-Origin","*");
	db.open( function(err,mongoclient){
		mongoclient.collection('postagem', function(err,collection){
			collection.find(objectId(req.params.id)).sort({_id: -1}).toArray(function(err,results){
				if (err){
					res.json(err);
				} else {
					res.json(results);
				}
				mongoclient.close();
			});
		});
	});
});

app.get('/imagens/:imagem', function(req,res){
	let img = req.params.imagem;
	res.setHeader("Access-Control-Allow-Origin","*");
	fs.readFile('./uploads/'+img, function(err, content){
		if (err){
			res.status(400).json(err);
			return;
		}

		res.writeHead(200,{'content-type' : 'image/jpg'});
		res.end(content);

	});

});

//update titulo do post by id do db
app.put("/api_posts/:id", function(req,res){
	res.setHeader("Access-Control-Allow-Origin","*");
	db.open( function(err,mongoclient){
		mongoclient.collection('postagem', function(err,collection){
			collection.update(
				{ _id : objectId(req.params.id) },
				{ $set : { titulo : req.body.titulo}},
				{},
				function(err, records){
					if (err){
						res.json(err);
					} else {
						res.json(records);
					}

					mongoclient.close();
				}
			);
		});
	});
});

app.get("/api_posts/:id", function(req,res){

	res.setHeader("Access-Control-Allow-Origin","*");

	db.open( function(err,mongoclient){
		mongoclient.collection('postagem', function(err,collection){
			collection.find({ _id : objectId(req.params.id) }).toArray(
				function(err, records){
					if (err){
						res.json(err);
					} else {
						console.log(records);

						res.send(records);
					}

					mongoclient.close();
				}
			);
		});
	});
});

app.get("/api_get_profile_look_like/:id", function(req,res){

	res.setHeader("Access-Control-Allow-Origin","*");
	db.open( function(err,mongoclient){
		mongoclient.collection('users', function(err,collection){
			collection.find({ username : { $regex: req.params.id } }).toArray(
				function(err, records){
					if (err){
						res.json(err);
					} else {
						
						res.json(records);
					}

					mongoclient.close();
				}
			);
		});
	});
});

//insert comentario do post by id do db
app.put("/api_comentario/:id", function(req,res){
		res.setHeader("Access-Control-Allow-Origin","*");
	db.open( function(err,mongoclient){
		mongoclient.collection('postagem', function(err,collection){
			collection.update(
				{ _id : objectId(req.params.id) },
				{ $push : {  
						comentarios : {
							id_comentario : new objectId(),
							comentario : req.body.comentario,
							username : req.body.username
						}
					}	
				},
				function(err, records){
					if (err){
						res.json(err);
					} else {
						io.sockets.emit('newComment');
						res.json(records);
					}

					mongoclient.close();
				}
			);
		});
	});
});



//delete post by id do db
app.delete("/api_comentario/:id", function(req,res){
	res.setHeader("Access-Control-Allow-Origin","*");
	db.open( function(err,mongoclient){
		mongoclient.collection('postagem', function(err,collection){
			collection.update(
				{ },
				{ $pull : {
						comentarios : { id_comentario : objectId(req.params.id) }
					}
				},
				{multi:true},
				function(err, records){
					if (err){
						res.json(err);
					} else {
						res.json(records);
					}
					mongoclient.close();
				}
			);
		});
	});
});

var mongoose = require('mongoose');
let db_ = mongoose.connect('mongodb://localhost:27017/meu_instagram_clone',  { useNewUrlParser: true })
    .catch(err => console.error('Something went wrong', err));

const userSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    username: String,
    name: String,
    password: String,
    _idFollowing: Array,
    _idFollower: Array
},{
    versionKey: false
});
 
const User = mongoose.model('User', userSchema);

//get user by id
app.get("/api_users_by_id/:id", function(req,res){
		res.setHeader("Access-Control-Allow-Origin","*");
	User.findOne({_id : req.params.id}).exec( function(err,req){
		if (err){
			console.log("err:"+err);
		} else {
			res.json(req);
		}
	});
	
});

//get user by username
app.get("/api_get_profile/:id", function(req,res){
	res.setHeader("Access-Control-Allow-Origin","*");
	User.findOne({username : req.params.id}).exec( function(err,req){
		if (err){
			console.log("err:"+err);
		} else {
			res.json(req);
		}
	});
	
});


//get all users by id
app.get("/api_users/", function(req,res){

	res.setHeader("Access-Control-Allow-Origin","*");
	User.find().exec( function(err,req){
		if (err){
			console.log("err:"+err);
		} else {
			res.json(req);
		}
	});
	
});

app.get("/api_users/:username", function(req,res){
	res.setHeader("Access-Control-Allow-Origin","*");
	User.findOne({username : req.params.username}).exec( function(err,req){
		if (err){
			console.log("err:"+err);
		} else {
			res.json(req);
		}
	});
	
});

app.post("/api_users/", function(req,res){
		res.setHeader("Access-Control-Allow-Origin","*");
		var newUser = new User();
		newUser._id = mongoose.Types.ObjectId();
		newUser.username = req.body.username;
		newUser.name = req.body.name;
		newUser.password = req.body.password;
		newUser._idFollowing = {_id: new mongoose.Types.ObjectId, following: newUser.username};
		
		newUser.save(function(err, new_user){
	        if(err) {
	            res.send('error saving new user');
	        } else {
	        	console.log(newUser);
	            res.json(new_user);
	        }
		});
});

//get all following
app.get("/api_users_get_all_folowing/:id", function(req,res){
		res.setHeader("Access-Control-Allow-Origin","*");
	User.find({_id : mongoose.Types.ObjectId(req.params.id)}, "_idFriends").exec( function(err,req){
		if (err){
			console.log("err:"+err);
		} else {
			res.json(req);
		}
	});
});

app.put("/api_insert_following/", function(req,res){
		res.setHeader("Access-Control-Allow-Origin","*");
	console.log("following.username:"+req.body.username);
	console.log("following.following_id:"+req.body.following_username);

	User.findOneAndUpdate({username : req.body.username},{
	  "$push" : {
	  	_idFollowing: {
	  	_id : new mongoose.Types.ObjectId,
	    following: req.body.following_username
		}
	  }
	}, function(err, data2){
		User.updateOne(
		    { username:  (req.body.following_username) },
		    { $push : { _idFollower : { _id: new mongoose.Types.ObjectId(), follower: req.body.username } } },  { upsert: true },
		    function(err, numAffected) { 
		        if(err){
		            console.log(err);
		        } else {
		        	console.log(numAffected);
		        	res.status(200).send();
		        }
		    }
		    );
	});

});

app.put("/api_delete_following/", function(req,res){
	res.setHeader("Access-Control-Allow-Origin","*");
	console.log("username:" +req.body.username);

	console.log("unfollowing_id:" +req.body.unfollowing_id);

    User.updateOne(
    { "username": req.body.username },
    { "$pull": { _idFollowing: { following: req.body.unfollowing_username } } },
    function(err, numAffected) { 
        if(err){
            console.log(err);
        } else {
        	User.updateOne(
		    { username: req.body.unfollowing_username },
		    { $pull: { _idFollower: { follower: req.body.username } } },
		    function(err, numAffected) { 
		        if(err){
		            console.log(err);
		        } else {
		        	console.log(numAffected);
		            res.status(200).send();
		        }
		    });
        }
    }
);

});
