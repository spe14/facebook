const session = require('express-session');
var db = require('./models/database.js');

var getMain = function(req, res) {
	session_name = req.session;
	console.log(session_name.userid, "SESSION NAME")
	if (session_name.userid){

		var user = req.session.userid;
	
	db.get_all_friend_posts(user, function(err, data) {
		if (data == null) {
			console.log(err);
		} else {
			console.log("data " + data);
			
			db.get_friend_comments(data, function(err2, data2) {
				if (data2 == null) {
					console.log(err2);
				} else {
					console.log("data2");
					console.log(data2);
					console.log("got all friends posts");
					res.render('index.ejs', {message: null, user: user, data: data, data2: data2});
				}
			});
		}
	});

  		//res.render('index.ejs',{message: null, user: session_name.userid});
  		//res.render('index.ejs',{message: null, user: session_name.userid});
	} else{
		res.redirect('/?err=3');
	}
};

var signUp = function (req, res) {
	if (req.query.error == 4) {
		res.render('signup_page.ejs', {message: "Username already exists"});
		
	} else if (req.query.error == 5) {
		res.render('signup_page.ejs', {message: "Error encountered while signing up"});
		
	} else {
		res.render('signup_page.ejs', {message: null});	
	}
	
};

var change = function (req, res) {
	session_name = req.session;
	if (session_name.userid) {
		if (req.query.err == 1) {
			res.render('change_account.ejs', {message: "Incorrect Password Entered"});
		} else if (req.query.err == 3) {
			res.render('change_account.ejs', {message: "Error Occurred, could not update information"});
		} else if (session == null){
			res.redirect('/');
		} else {
			res.render('change_account.ejs', {message: null});
		}
		
	} else {
		res.redirect('/?err=3');
	}
};
// Insert the function to hash the password here
var SHA256 = function(s) {
	var chrsz = 8;
 	var hexcase = 0;

 	function safe_add (x, y) {
 		var lsw = (x & 0xFFFF) + (y & 0xFFFF);
 		var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
 		return (msw << 16) | (lsw & 0xFFFF);
 	}

 	function S (X, n) { return ( X >>> n ) | (X << (32 - n)); }
 	function R (X, n) { return ( X >>> n ); }
 	function Ch(x, y, z) { return ((x & y) ^ ((~x) & z)); }
 	function Maj(x, y, z) { return ((x & y) ^ (x & z) ^ (y & z)); }
 	function Sigma0256(x) { return (S(x, 2) ^ S(x, 13) ^ S(x, 22)); }
 	function Sigma1256(x) { return (S(x, 6) ^ S(x, 11) ^ S(x, 25)); }
 	function Gamma0256(x) { return (S(x, 7) ^ S(x, 18) ^ R(x, 3)); }
 	function Gamma1256(x) { return (S(x, 17) ^ S(x, 19) ^ R(x, 10)); }

	function core_sha256 (m, l) {
	 	var K = new Array(0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786, 0xFC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA, 0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x6CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070, 0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2);
	 	var HASH = new Array(0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19);
	 	var W = new Array(64);
	 	var a, b, c, d, e, f, g, h, i, j;
	 	var T1, T2;
	
	 	m[l >> 5] |= 0x80 << (24 - l % 32);
	 	m[((l + 64 >> 9) << 4) + 15] = l;
	
	 	for ( var i = 0; i<m.length; i+=16 ) {
	 		a = HASH[0];
	 		b = HASH[1];
	 		c = HASH[2];
	 		d = HASH[3];
	 		e = HASH[4];
	 		f = HASH[5];
	 		g = HASH[6];
	 		h = HASH[7];
	
	 	for ( var j = 0; j<64; j++) {
	 		if (j < 16) W[j] = m[j + i];
	 		else W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);
	
	 		T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
	 		T2 = safe_add(Sigma0256(a), Maj(a, b, c));
	
	 		h = g;
			g = f;
	 		f = e;
	 		e = safe_add(d, T1);
	 		d = c;
	 		c = b;
	 		b = a;
	 		a = safe_add(T1, T2);
	 	}
	
	 	HASH[0] = safe_add(a, HASH[0]);
	 	HASH[1] = safe_add(b, HASH[1]);
	 	HASH[2] = safe_add(c, HASH[2]);
	 	HASH[3] = safe_add(d, HASH[3]);
	 	HASH[4] = safe_add(e, HASH[4]);
	 	HASH[5] = safe_add(f, HASH[5]);
	 	HASH[6] = safe_add(g, HASH[6]);
	 	HASH[7] = safe_add(h, HASH[7]);
	 	
	 	}
	 
	 	return HASH;
	 	
 	}

	function str2binb (str) {
	 	var bin = Array();
	 	var mask = (1 << chrsz) - 1;
	 	for(var i = 0; i < str.length * chrsz; i += chrsz) {
	 		bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - i % 32);
	 	}
	 	
	 	return bin;
	 	
	}

	function Utf8Encode(string) {
		string = string.replace(/\r\n/g,'\n');
		var utftext = '';
	
		for (var n = 0; n < string.length; n++) {
	
		var c = string.charCodeAt(n);
	
		if (c < 128) {
	 		utftext += String.fromCharCode(c);
		}
		else if((c > 127) && (c < 2048)) {
			utftext += String.fromCharCode((c >> 6) | 192);
			utftext += String.fromCharCode((c & 63) | 128);
		}
		else {
			utftext += String.fromCharCode((c >> 12) | 224);
			utftext += String.fromCharCode(((c >> 6) & 63) | 128);
			utftext += String.fromCharCode((c & 63) | 128);
		}
	
		}
	
		return utftext;
	 	
	}

 	function binb2hex (binarray) {
 		var hex_tab = hexcase ? '0123456789ABCDEF' : '0123456789abcdef';
 		var str = '';
 		for(var i = 0; i < binarray.length * 4; i++) {
 			str += hex_tab.charAt((binarray[i>>2] >> ((3 - i % 4)*8+4)) & 0xF) +
 			hex_tab.charAt((binarray[i>>2] >> ((3 - i % 4)*8 )) & 0xF);
 		}
 		
 		return str;
 		
 	}

 	s = Utf8Encode(s);
 	return binb2hex(core_sha256(str2binb(s), s.length * chrsz));
 	
}
var getUser = function(req, res) {
	
	console.log("We reached where we wanted getUser");
	session_name = req.session;
	username = session_name.userid;
	console.log(username);
	res.send(JSON.stringify(username));
};

var getCurrPro = function(req, res) {
	
	console.log("We reached where we wanted getUser");
	
	console.log(username, "in routes curr pro");
	res.send(JSON.stringify(username));
};

var getCurrentProf = function(req, res) {
	session_name = req.session;
	cProfile = session_name.currProfile;
	res.send(JSON.stringify(cProfile));
};


var addPost = function (req, res) {
	session_name = req.session;
	var content = req.body.post_content;
	var author = session_name.userid;
	var username = session_name.currProfile;
	console.log(username);
	var id = username + Date.now();
	console.log("ADDING POST!!");
	

	// var author = "user"
	console.log("content", content);
	console.log("author", author);
	console.log("username", username);
	
	var timestamp2 = Date.now();
	db.update_active(author, timestamp2, function(err, data) {
		if (data == null) {
			console.log("error updating active status");
		} else {
			console.log("updated active status");
		}
	});
	
	db.add_post(content, username, timestamp2, author, id, function(err,data){
		if (data == null) {
			console.log("error adding post");
		} else{
			console.log("added post");
			res.redirect('/profile/' + username);
			//res.redirect('/getprofile');
			/*var d = {
				"poster": username,
				"timestamp": timestamp2
			}
			req.session.data = d;
			res.redirect('/getnewpost');*/
		}
	});


};

var addComment = function(req, res) {
	console.log("REACHING ADD COMMENT");
	session_name = req.session;
	var content = req.body.post_content; 
	console.log(content);
	//var timestamp = req.body.timestamp; 
	var timestamp = Date.now();
	console.log(timestamp);
	var author = session_name.userid;
	console.log(author);
	var post_id = req.params.id;
	var comment_id = author + timestamp;
	var username = session_name.currProfile;
	
	db.add_comment(content, timestamp, author, post_id, comment_id, function(err, data) {
		if (data == null) {
			console.log(err);
		} else {
			console.log("added comment");
			console.log("redirecting");
			console.log(username);
			res.redirect('/profile/' + username);
			//res.redirect('/getprofile');
			//res.send(JSON.stringify(data));
			//res.redirect('/getcomments/' + post_id);
			//res.send(JSON.stringify(data));
		}
	});
	
};

var checkUser = function(req, res) {
//retrieve the variables from the website
  var username = req.body.un;
  var password = req.body.pw;
  //call the datbase function
  session_name = req.session;
	  db.check_user(username, SHA256(password), function (err, data) {
	//console.log(data.Items)
		//console.log(SHA256(password));
		//console.log(data.Items[0].password.S)
		if (data == "error1") {
			console.log("user does not exist");
			res.redirect('/?err=1');
		} else if (data == "error2") {
			console.log("user exists, but incorrect password");
			res.redirect('/?err=2');
		} else {
			var timestamp = Date.now();
			console.log("Logging in...")
			session_name.userid = username;
			
			session_name.save();
			db.update_active(username, timestamp, function(err, data) {
				if (data == null) {
					console.log("error updating active status");
				} else {
					console.log("updated active status");
				}
			});
			res.redirect('/homepage');
		}
		
		});

};


var changeAccount = function(req, res){
	var username = req.session.userid;
	var currPassword = req.body.password;
	var newPassword = req.body.newpassword;
	var newEmail = req.body.newemail;
	var newAffiliation = req.body.newaffiliation;
	var newInterests = req.body.interests;
	
	console.log("new password : " + newPassword);
	console.log("new email: " + newEmail);
	console.log("new affiliation : " + newAffiliation);
	console.log("new interests : " + newInterests);
	
	session_name = req.session;
	
	db.check_user(username, SHA256(currPassword), function (err, data) {
		if ((data == "error2")) {
			console.log("incorrect password entered!");
			res.redirect('/changeaccount?err=1');
		} else {
			var timestamp = Date.now();
			// No matching username is found - thus, add Item to users table
			db.update_account(username, newPassword, newEmail, newAffiliation, newInterests, function (err, data) {
				if (err) {
					// Error was encountered while updating user info
					console.log(err);
					return res.redirect('/changeaccount?err=2');
					
				} else {
					
					if (newInterests != undefined) {
						var content = username + " is now interested in ";
						
						if (newInterests.length == 2) {
							content = content + newInterests[0] + " and " + newInterests[1];
						} else {
							for (var i = 0; i < newInterests.length; i++) {
								if (i == newInterests.length - 1) {
									content = content + " and " + newInterests[i];
								} else {
									content = content + newInterests[i] + ", ";
								}
							}
						}
						
						var timestamp2 = Date.now();
						//var date = new Date(Date.now()).toString();
						var author = username;
						//var user = username;
						var id = username + timestamp2;
						var date = new Date(timestamp2);
						console.log('ID IS ' + id);
						
						db.add_post(content, username, timestamp2, author, id, function(err, data) {
							if (err) {
								console.log("error adding status update");
							} else {
								console.log("added status update");
							}
						});
					}
					
					if (newAffiliation != "") {
						var content = username + "'s affiliation changed to " + newAffiliation;
						var date = new Date(Date.now()).toString();
						var author = username;
						var user = username;
						var timestamp2 = Date.now();
						var id = username + timestamp2;
						var date = new Date(timestamp2);
						
						db.add_post(content, user, timestamp2, author, id, function(err, data) {
							if (err) {
								console.log("error adding status update");
							} else {
								console.log("added status update");
							}
						});	
					}
					
					
					return res.redirect('/homepage');
				}
				
			});
		}
	});
	
	var timestamp = Date.now();
	db.update_active(username, timestamp, function(err, data) {
		if (data == null) {
			console.log("error updating active status");
		} else {
			console.log("updated active status");
		}
	});
	
	
};

var getAllFriendPosts = function(req, res) {
	var user = req.session.userid;
	
	db.get_all_friend_posts(user, function(err, data) {
		if (data == null) {
			console.log(err);
		} else {
			db.get_all_comments(data, function(err2, data2) {
				if (data2 == null) {
					console.log(err2);
				} else {
					console.log("got all friends posts");
					res.render('index.ejs', {data: data, data2: data2});
				}
			});
		}
	});
}


var createAccount = function (req, res) {
	var currUsername = req.body.username;
	var currPassword = req.body.password;
	var currFirst = req.body.first;
	var currLast = req.body.last;
	var currAffiliation = req.body.affiliation;
	var currEmail = req.body.email;
	var currBirthday = req.body.birthday;
	var bday = currBirthday.toString();
	var currInterests = req.body.interests;
	
	console.log(currUsername);
	console.log(currPassword);
	console.log(currFirst);
	console.log(currLast);
	console.log(currAffiliation);
	console.log(currEmail);
	console.log(bday);
	console.log(currInterests);
	
	db.look_up(currUsername, function (err, data) {
		if (data == null) {
			// No matching username is found - thus, add Item to users table
			var timestamp = Date.now();
			db.add_user(currUsername, currPassword, currFirst, currLast, currEmail, currAffiliation, bday, currInterests, timestamp, function (err, data) {
				if (err) {
					// Error was encountered while putting in the Item into users table
					console.log(err);
					return res.redirect('/signup?error=5');
					
				} else {
					// Successful addition of new Item into users table
					
					// Update session object so that currUsername is stored in userid field
					req.session.userid = currUsername;
					
					// Redirect to user's specific home page (will fill in with correct URL) 
					return res.redirect('/profile/' + currUsername);
						
				}
				
			});
			
		} else if (data.Items[0].username.S == currUsername) {
			// Username already exists in the user table - thus, return to sign-up page with error
			// message
			return res.redirect('/signup?error=4');	
			
		} else {
			console.log(err);
			return res.redirect('/signup?error=5');	
			
		}
		
	});
	
};

var searchNews = function(req, res) {
	var keyword = req.body.keyword;
	db.query_news(keyword, function(err, data) {
		if (err) {
			console.log(err);
		} else {
			res.send(JSON.stringify(data));
		}
	});
}

var getUsers = function(req, res) {
	console.log("getting the users ... ")
	db.get_users(function(err, data) {
		if (err) {
			console.log(err);
			console.log("hey again")
		} else {
			console.log("sending users over");
			res.send(data);
		}
	});
}


var login = function(req, res) {
	if (req.query.err == 1) {
		res.render('login.ejs',{message: "user does not exist"});
	} else if (req.query.err == 2) {
		res.render('login.ejs',{message: "incorrect password entered for user"});
	} else if (req.query.err == 3) {
		res.render('login.ejs',{message: "Please log in to view PennBook!"});
	} else {
		res.render('login.ejs', {message: null});
	}
}

var addFriends = function(req, res) {
	session_name = req.session;
	var username1 = session_name.userid;
	var username2 = req.body.friend;
	console.log(username1, "first user");
	console.log(username2, "second user");
	
	var timestamp = Date.now();
	
	db.update_active(username1, timestamp, function(err, data) {
		if (data == null) {
			console.log("error updating active status");
		} else {
			console.log("updated active status");
		}
	});
	
	db.look_up(username2, function(err, data) {
		if (data == null) {
			console.log("user does not exist");
			res.redirect('/addfriendspage?err=1');
		} else {
			db.add_friend(username1, username2, function(err, data) {
				if (err) {
					console.log(err);
				} else {
					console.log("success: ",username1," and ", username2,"are now friends");
				}
			});
			res.redirect('/addfriendspage?err=2');
		}
	});
	
	
}

var addFriendsPage = function(req, res) {
	session_name = req.session;
	if (session_name.userid) {
		if (req.query.err == 1) {
			console.log("error here");
			res.render('addfriends.ejs', { message : "User does not exist" });
		} else if (req.query.err == 2) {
			res.render('addfriends.ejs', { message : "successfully added friend!" });
		} else {
			res.render('addfriends.ejs', { message : null });
	  	}
	} else {
		res.redirect('/?err=3');
	}
}

var viewFriends = function(req, res) {
session_name = req.session;
if (session_name.userid) {
	if(session!=null){
		username = session_name.userid;
		console.log(username);
		var timestamp = Date.now();
		
		db.view_friends(username, function(err, data) {
			if (data == null) {
				console.log(err);
			} else {
				res.render('viewfriends.ejs', { data : data });
			}
		});
			
			db.update_active(username, timestamp, function(err, data) {
				if (data == null) {
					console.log("error updating active status");
				} else {
					console.log("updated active status");
				}
			});
		} else {	
			res.redirect('/');
		}	
	} else {
		res.redirect('/?err=3');
	}	

}

var joinChatRoom = function(req, res) {
	username = req.session.userid;
	const friend = req.body.nameOfUser;
	//res.send({success: true});
	const arr = [username, friend];
	arr.sort();
	const room = arr[0]+arr[1];
	
	var timestamp = Date.now();
	db.update_active(username, timestamp, function(err, data) {
		if (data == null) {
			console.log("error updating active status");
		} else {
			console.log("updated active status");
		}
	});
	
	db.check_chat(room, function(err, data) {
		if(err) {
			console.log("error");
		}
		if (data == null) {
			console.log("chatroom doesn't exist'");
			db.add_chatroom(room, username, friend, function(err, data) {
		if (data == null) {
			console.log(err);
		} else {
			console.log("just created chat room");
		}
	});
		} else {
			console.log("chatroom exists");
		}
	});
	
	db.add_chatnotif(friend, username, room, function(err, data) {
		if (data == null) {
			console.log(err);
		} else {
			console.log("just created chat room");
		}
	});
	
	
	console.log("we reached here");
	console.log(room);
	req.session.roomId = room;
	req.session.inRoom = true;
	req.session.save();
	res.send(room);
}

var leaveChatRoom = function(req, res) {
	const room = req.body.room;
	req.session.inRoom = false;
	req.session.save();
	res.send({success: true});
	
	
}
var sendMessage = function(req, res) {
	username = req.session.userid;
	const nameOfUser = req.body.nameOfUser;
	const message = req.body.message;
	const room = req.body.room;
	const date = req.body.date;
	console.log(username);
	
	var timestamp = Date.now();
	db.update_active(username, timestamp, function(err, data) {
		if (data == null) {
			console.log("error updating active status");
		} else {
			console.log("updated active status");
		}
	});
	
	db.send_chat(room, nameOfUser, message, date, function(err, data) {
		if (data == null) {
			console.log(err);
		} else {
			console.log("writtenchat!");
		}
	});
};
var createChatRoom = function(req, res) {
	session_name = req.session;
	
	if (session_name.userid) {
		username = req.session.userid;
		console.log(username);
		var timestamp = Date.now();
		req.session.inRoom = false;
	req.session.save();
		db.update_active(username, timestamp, function(err, data) {
			if (data == null) {
				console.log("error updating active status");
			} else {
				console.log("updated active status");
			}
		});
		db.get_active_friends(username, timestamp, function(err, data) {
			if (data == null) {
				console.log(err);
			} else {
				console.log(data);
				res.render('chat.ejs', { data : data });
			}
		});
		
	} else {
		res.redirect('/?err=3');
	}
	
};

var getChatData = function(req, res) {
	console.log("WE REACHED");
	var timestamp = Date.now();
	username = req.session.userid;
	db.get_active_friends(username, timestamp, function(err, data) {
		if (data == null) {
			console.log(err);
		} else {
			res.send(JSON.stringify(data));
		}
	});
};

//this function gets the profile of the current user 
var getProfile = function ( req, res) {
	console.log("in get progile")
// store userId on login into session or any global variable 
	// var session_name = req.session;
	
	// if(session_name.userid){
	// 	var userid = req.session.userid;
	// 	// var userid = req.userid
	
   	// 	res.redirect('/profile/'+userid) ;
	// } else{
	// 	res.redirect('/');
	// }
	if(session!=null){
		var userid = req.session.userid;
		// var userid = req.userid
	
   		res.redirect('/profile/'+userid) ;
	}else{
		res.redirect('/');
	}
};

var profile = function (req, res) {
	session_name = req.session;
	console.log("IN PROFILE")
	if (session_name.userid) {
		if(session!=null){
			console.log(",");
      		const user = req.params.id;
      		req.session.currProfile = user;
      		req.session.save();
      		const userid = req.params.id;
			req.session.currProfile = userid;
			req.session.save();
      		console.log("CHECKING USER HERE");
      		db.check_user(req.session.currProfile, null, function(err, data){
				if (data == "error1") {
					console.log("this user doesn't exist");
					res.redirect('/homepage');
				} else {
					console.log(req.session.currProfile, "USER ID");
					/*db.get_all_comments(userid, function(err2, data2) {
						if (data2 == null) {
							console.log(err2);
						} else {
							console.log(data2.length);
							console.log(data2);
						}
					});*/
	  				db.get_posts(req.session.currProfile, function(err2, data2) {
					if (data2 == null) {
						console.log(err2);
					} else {
						//res.render('profiletest.ejs', {user: userid, data:data});
						//res.render('profile.ejs', {user: userid, data:data});  
						
						db.get_all_comments(data2, function(err3, data3) {
							if (data3 == null) {
								console.log("error in get all comments");
								console.log(err3);
							} else {
								console.log("this is data3: " + data3);
								console.log("data3 length : " + data3.length);
								res.render('profiletest2.ejs', {user: req.session.currProfile, data2: data2, data3: data3}); 
							}
						});
						
					}
					});
				}
	 	});
		} else {
			res.redirect('/');
		}
	} else {
		res.redirect('/?err=3');
	}
};
var getFriendPosts = function(req, res){
	console.log("are we getting freind's posts");
	var id = req.session.currProfile;
	db.get_(id, function(err, data) {
	if (data == null) {
		console.log("id is", id)
	    console.log(err);
	} else {
		console.log("did we send to getPosts")
			//res.send(JSON.stringify(data));
			res.send(data);  
		}
	});
	
}
var getPosts = function(req, res){
	console.log("ARE WE AT GETPOSTS");
	var id = req.session.currProfile;
	db.get_posts(id, function(err, data) {
	if (data == null) {
		console.log("id is", id)
	    console.log(err);
	} else {
		console.log("did we send to getPosts")
			//res.send(JSON.stringify(data));
			res.send(data);  
		}
	});
	
}


var getComments = function(req, res) {
	console.log("getting the comments HERE");
	var id = req.params.id;
	
	console.log("post id is " + id);
	db.get_comments(id, function(err, data) {
		if (data == null) {
			console.log(err);
		} else {
			res.send(JSON.stringify(data));
		}
	});
}

var getChats = function(req, res) {
	const room = req.body.room;
		console.log("THEROOMIS");
	console.log(room);
	db.get_chat(room, function(err, data) {
		if (data == null) {
			console.log(err);
		} else {
			console.log("we sent it")
			res.send(data);
		}
	});
};

var getChatNotifs = function(req, res) {
	username = req.session.userid;
		console.log("did we reach chat notifs");
	db.get_chatnotif(username, function(err, data) {
		if (data == null) {
			console.log(err);
		} else {
			console.log("we sent it")
			console.log("CHAT NOTIF SUCCESS");
			console.log(data);
			res.send(JSON.stringify(data));
		}
	});
};


var getActiveFriends = function(req, res) {
	username = req.session.userid;
	var timestamp = Date.now();
	
	db.get_active_friends(username, timestamp, function(err, data) {
		if (data == null) {
			console.log(err);
		} else {
			console.log("successfully got active friends of " + username);
			//console.log(data);
			res.render('activefriendstest.ejs', { data : data });
		}
	});
	
}


var sendgcNotif = function(req, res) {
	username = req.session.userid;
	var timestamp2 = Date.now();
	db.update_active(username, timestamp2, function(err, data) {
		if (data == null) {
			console.log("error updating active status");
		} else {
			console.log("updated active status");
		}
	});
	const friend1 = req.body.friend1;
	const friend2 = req.body.friend2;
	const friend3 = req.body.friend3;
	const groupRoomId = req.body.groupRoomId;
	const groupName = req.body.groupName;
	console.log("the group name");
	console.log(groupName);
	const timestamp = req.body.timestamp;
	console.log("did we get timestamp");
	console.log(timestamp);

			

	db.send_groupchat(groupRoomId, friend1, friend2, friend3, timestamp, groupName, function(err, data) {
		if (data == null) {
			console.log(err);
		} else {
			console.log("did this ");
			db.send_groupchat_other(groupRoomId, friend1, friend2, friend3, groupName, function(err, data) {
		if (data == null) {
			console.log(err);
		} else {
			console.log("and this");
			req.session.inRoom = true;
			req.session.roomId = groupRoomId;
			req.session.save();
			res.send("true");
		}
	});
		}
	});

}
var getRoom = function(req, res) {
	
	console.log("We reached where we wanted getUser");
	session_name = req.session;
	room = session_name.roomId;
	console.log("room is");
	console.log(room);
	res.send(JSON.stringify(room));
};

var getGroupMembers = function(req, res) {
	console.log("WE REACHED");
	const roomId = req.body.room;
	db.get_group_mems(roomId, function(err, data) {
		if (data == null) {
			console.log(err);
		} else {
			res.send(data.Items);
		}
	});
};

var sendSingleMem = function(req, res) {
	console.log("did THIS WORK BRUH");
	
	const username = req.session.userid;
	var timestamp2 = Date.now();
	db.update_active(username, timestamp2, function(err, data) {
		if (data == null) {
			console.log("error updating active status");
		} else {
			console.log("updated active status");
		}
	});
	const groupRoomId = req.body.groupRoomId;
	const timestamp = req.body.timestamp;
	const addF = req.body.addF;
	const groupName = req.body.group;
	console.log(username);
	console.log(groupRoomId);
	console.log(timestamp);
	console.log(addF);
	console.log(groupName);
	
	db.add_group_mem(groupRoomId, addF, username, timestamp, groupName, function(err, data) {
		if (data == null) {
			console.log(err);
		} else {
			console.log("success group chat2");
			db.addgroupmem_other(groupRoomId, addF, groupName, function(err, data) {
		if (data == null) {
			console.log(err);
		} else {
			console.log("success group chat2");
			res.send("true");
		}
	});
		}
	});
};
var getGroupNotifs = function(req, res) {
	username = req.session.userid;
		console.log("did we reach chat notifs");
	db.get_group_notifs(username, function(err, data) {
		if (data == null) {
			console.log(err);
		} else {
			console.log("we sent it")
			console.log("CHAT NOTIF SUCCESS");
			console.log(data);
			res.send(JSON.stringify(data));
		}
	});
};

var getFriendsCurrUser = function(req, res) {
	username = req.session.userid;
	var name;
	
	//console.log(name);
	
	db.get_friends(username, null, function(err, data) {
		if (data == null) {
			console.log(err);
		} else {
			//console.log(data);
			//var jsonString =  {"id" : username, }
			
			//res.send(JSON.stringify(data));
			
			db.get_user_data(username, function(err2, data2) {
				if (data2 == null) {
					console.log(err2);
				} else {
					console.log("data 2 : " + data2.Items);
					console.log(data2.Items[0].first.S);
					console.log(data2.Items[0].affiliation.S);
					name = data2.Items[0].first.S;
					
					var friendString = [];
					//console.log("friend data : " + data);
					//console.log("data length: " + data.length);
					
					for (var i = 0; i < data.length; i++) {
						var friend_id = data[i].username.S;
						var friend_name = data[i].first.S;
						
						var jsonFriend = {"id" : friend_id, "name": friend_name, "data": [], children: []};
						friendString.push(jsonFriend);
					}
					
					var jsonString = {"id" : username, "name" : name, 
					"data" : [],
					"children": friendString}
					
					res.send(jsonString);
				}
			});
		}
	});
}

var getFriendsNodeUser = function(req, res) {
	console.log(req.params.user);
	friend_username = req.params.user;
	console.log(friend_username);
	user = req.session.userid;
	
	db.get_user_data(user, function(err, data) {
		if (data == null) {
			console.log(err);
		} else {
			console.log("successfully got affiliation and name of " + user);
			var friend_name = data.Items[0].first.S;
			var affil = data.Items[0].affiliation.S;
			console.log(affil);
			
			db.get_friends(friend_username, affil, function(err2, data2) {
				if (data2 == null) {
					console.log(err2);
				} else {
					console.log("successfully got friends of " + friend_username);
					
					//name = data2.Items[0].first.S;
					
					var friendString = [];
					console.log("friend data : " + data2);
					console.log("data length: " + data2.length);
					
					for (var i = 0; i < data2.length; i++) {
						var friend_id = data2[i].username.S;
						var friend_name2 = data2[i].first.S;
						
						var jsonFriend = {"id" : friend_id, "name": friend_name2, "data": [], children: []};
						friendString.push(jsonFriend);
					}
					
					var jsonString = {"id" : friend_username, "name" : friend_name, 
					"data" : [],
					"children": friendString}
					
					res.send(jsonString);
				}
			});
			
		}
		
	});
}


var friendVis = function(req, res) {
	console.log("got here 1");
	session_name = req.session;
	
	if (session_name.userid){
  		res.render('friendvisualizer.ejs');
	} else{
		res.redirect('/?err=3');
	}
	
	//res.render('friendvisualizer.ejs');
}

var getInfo =  function(req, res) {
	console.log("did we REACH HERE");
	f = req.body.fren;
	console.log("are we HERE");
	db.get_details(f, function(err, data) {
		if (data == null) {
			console.log(err);
		} else {
			console.log(data);
			res.send(data);
		}
	});
}

var setRoom = function (req, res) {
	username = req.session.userid;
	roomId = req.body.roomId;
	var timestamp = Date.now();
	db.update_active(username, timestamp, function(err, data) {
		if (data == null) {
			console.log("error updating active status");
		} else {
			console.log("updated active status");
		}
	});
	console.log("are we at setRoom");
	console.log(roomId);
	req.session.roomId = roomId;
	req.session.inRoom = true;
	req.session.save();
	
}
var isInRoom = function (req, res) {
	console.log("are we here at ROOM");
	res.send(req.session.inRoom);
}
var getPeopleNotInGC = function (req, res) {
	room = req.session.roomId;
	username = req.session.userid;
	var timestamp = Date.now();
	db.get_not_in_gc(username, room, timestamp, function(err, data) {
		if (err) {
			console.log("error");
		} else {
			res.send(JSON.stringify(data));
		}
	});
	
}
var getPeopleNotInChat = function (req, res) {
	room = req.session.roomId;
	username = req.session.userid;
	var timestamp = Date.now();
	db.get_not_in_chat(username, room, timestamp, function(err, data) {
		if (err) {
			console.log("error");
		} else {
			res.send(JSON.stringify(data));
		}
	});
	
}

var getNewPost = function(req, res) {
	var poster = req.session.data.poster;
	var timestamp = req.session.data.timestamp;
	
	db.lookup_post(poster, timestamp, function(err, data) {
		if (data == null) {
			console.log(err);
		} else {
			res.send(JSON.stringify(data));
		}
	});
}

var logout = function(req, res) {
	console.log("logging out: " + req.session.userid);
	var username = req.session.userid;
	var timestamp = Date.now();
	console.log(timestamp);
	timestamp = timestamp - 600001;
	console.log(timestamp);
	
	
	db.update_active(username, timestamp, function(err, data) {
		if (data == null) {
			console.log(err);
		} else {
			console.log("updated log out status");
		}
	});
	
	req.session.destroy();
	res.redirect('/');
}
/*
var getAllFriendPosts = function(userid, callback) {
	console.log("getting friends for: " + userid);
	
	var params = {
		KeyConditions: {
        friend1: {
          ComparisonOperator: 'EQ',
          AttributeValueList: [ { S: userid } ]
        }
      },
      TableName: "friends",
      AttributesToGet: ['friend2']
	}
	
	var promiseList = [];
	
	db.query(params, function(err, data) {
		if (err || data.Items.length== 0) {
			callback(err, null);
		} else {
			for (var i = 0; i < data.Items.length; i++) {
				var params2 = {
				KeyConditions: {
       				 username: {
          			ComparisonOperator: 'EQ',
          			AttributeValueList: [ { S: data.Items[i].friend2.S } ]
        		}
     		 	},
     			 TableName: "posts",
     			 ScanIndexForward: false
				}
				promiseList.push(db.query(params2).promise());
			}
			
			Promise.all(promiseList).then(
				successfulDataArray => {
					//console.log(successfulDataArray);
					var res = [];
					for (var j = 0; j < successfulDataArray.length; j++) {
						//for (var k = 0; k < successfulDataArray[j].length; k++) {}
						//if (successfulDataArray.Items[])
						console.log("length of array " + successfulDataArray[j].Items.length);
						if (successfulDataArray[j].Items.length == 0) {
							var r = [];
							res.push(r);
						} else {
							res.push(successfulDataArray[j]);
						}
					}
					
					//console.log(res);
					callback(null, res);
				}
			);
			
			
		}
	});
}
*/




var routes = { 
  get_main: getMain,
  sign_up: signUp,
  create_account: createAccount,
  search_news: searchNews,
  change: change,
  change_account: changeAccount,
  add_post: addPost,
  add_friends: addFriends,
  add_friends_page: addFriendsPage,
  login: login,
  check_user: checkUser,
  get_user: getUser,
  view_friends: viewFriends,
  join_chatroom: joinChatRoom,
  leave_chatroom: leaveChatRoom,
  create_chatroom: createChatRoom,
  get_chatdata: getChatData,
  send_message: sendMessage,
  get_chats: getChats,
  get_chat_notifs: getChatNotifs,
  get_profile: getProfile,
  profile: profile, 
  get_curr_pro: getCurrPro, 
  get_posts: getPosts,
  get_active_friends: getActiveFriends,
  sendgroupchat_notif: sendgcNotif,
  get_group_members: getGroupMembers,
  send_single_mem: sendSingleMem,
  get_group_notifs: getGroupNotifs,
  get_users: getUsers,
  get_friends: getFriendsCurrUser,
  get_node_friends: getFriendsNodeUser,
  friend_vis: friendVis,
  get_info: getInfo,
  get_room: getRoom,
  set_room: setRoom,
  in_room: isInRoom,
  get_people_not_in_gc: getPeopleNotInGC,
  get_not_in_chat: getPeopleNotInChat,
  add_comment: addComment,
  get_comments: getComments,
  logout: logout,
  get_new_post: getNewPost,
  get_curr_prof: getCurrentProf,
  //get_all_friend_posts: getAllFriendPosts,
  //get_friend_comments: getFriendComments,
  //get_all_friend_posts: getAllFriendPosts,
  //get_curr_prof: getCurrentProf,
  //get_all_friend_posts: getAllFriendPosts,
  get_curr_prof: getCurrentProf,
};

module.exports = routes;