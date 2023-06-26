var express = require('express');
var routes = require('./routes.js');
var bodyParser = require('body-parser');
//var cookieParser = require('cookie-parser');
//var morgan = require('morgan');
var path = require('path');
var serveStatic = require('serve-static');
const sessions = require('express-session');
const { Server } = require("socket.io");
const http = require('http');
var app = express();
app.use(express.urlencoded({extended: true}));
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser());
//app.use(morgan('combined'));
app.use(serveStatic(path.join(__dirname, 'public')));


const server = http.createServer(app);

const io = new Server(server);


app.use(sessions({
    secret: "secretKey"
}));
app.use(function(req, res, next) {
  res.locals.user = req.session.user;
  next();
});



io.on("connection", function(socket){ 
	console.log("connected");
	socket.on("chat message", obj => {
		io.to(obj.room).emit("chat message", obj);
	});
	socket.on("join room", obj => {
		console.log("joined!");
		socket.join(obj.room);
		
	});
	socket.on("leave room", obj => {
		socket.leave(obj.room);
	});
});

app.get('/getuser', routes.get_user);
app.post('/check_user', routes.check_user);
app.get('/', routes.login);
app.get('/signup', routes.sign_up);
app.get('/homepage', routes.get_main);
app.get('/changeaccount', routes.change);
app.post('/createaccount', routes.create_account);
app.post('/addpost/:username', routes.add_post);
app.post('/changeaccount', routes.change_account);
app.get('/addfriendspage', routes.add_friends_page);
app.post('/addfriends', routes.add_friends);
app.get('/viewfriends', routes.view_friends);
app.post('/join', routes.join_chatroom);
app.post('/sendmessage', routes.send_message);
app.post('/leave', routes.leave_chatroom);
app.get('/createchat', routes.create_chatroom);
app.get('/getchatdata', routes.get_chatdata);
app.post('/getchats', routes.get_chats);
app.get('/getchatnotifs', routes.get_chat_notifs);
app.get('/get_curr_pro', routes.get_curr_pro);
app.get('/getprofile', routes.get_profile);
app.get('/getusers', routes.get_users);
app.get('/getposts', routes.get_posts);
app.get('/getactivefriends', routes.get_active_friends);
app.post('/sendgroupchatnotif', routes.sendgroupchat_notif);
app.post('/sendsinglegroupchat', routes.send_single_mem);
app.post('/getgroupmembers', routes.get_group_members);
app.get('/getgroupnotifs', routes.get_group_notifs);
app.get('/profile/:id', routes.profile);
//app.post('/profile/:id', routes.profile);
app.get('/getfriends/:user', routes.get_node_friends);
app.get('/friendvisualizer', routes.friend_vis);
app.get('/getfriends', routes.get_friends);
app.post('/getinfo', routes.get_info);
app.post('/isinroom', routes.in_room);
app.post('/setroomid', routes.set_room);
app.get('/getroom', routes.get_room);
app.post('/leavechat', routes.leave_chatroom);
app.get('/getpeoplenotingc', routes.get_people_not_in_gc);
app.get('/getpeoplenotinchat', routes.get_not_in_chat);
app.get('/getcomments/:id', routes.get_comments);
app.post('/addcomment/:id/:user', routes.add_comment);
//app.get('/addcomment', routes.add_comment);
app.get('/logout', routes.logout);
//app.post('addcomment', routes.add_comment);
app.get('/getnewpost', routes.get_new_post);
//app.get('/getpostsandcomments', routes.get_posts_and_comments);
app.get('/getcprofile', routes.get_curr_prof);
//app.get('/getallfriendposts', routes.get_all_friend_posts);
/* Run the server */

server.listen(8080);
console.log('Server running on port 8080. Now open http://localhost:8080/ in your browser!');

