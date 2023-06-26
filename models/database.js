var AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});
var db = new AWS.DynamoDB();
// const stemmer = require("stemmer");

var usernameLookup = function(username, callback) {
  console.log('Looking up: ' + username);

  var params = {
KeyConditionExpression: 'username = :username',
ExpressionAttributeValues: {
':username': {'S': username}
},
TableName: 'users'
  };

  db.query(params, function(err, data) {
    if (err || data.Items.length == 0) {
console.log("User does not exist in table");
    callback(err, null);
    } else {
console.log("User already exists in table");
    callback(null, data);
    }
  });
}

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

var addUser = function (username, password, first, last, email, affiliation, birthday, interests, timestamp, callback) {
console.log('Adding user: ' + username);

console.log(interests);
console.log(timestamp);
// Create a new Item, add the username, password, and first name to it, then
// add that item to the users table
var params = {
Item: {
"username": {
S: username
},
"password": {
S: SHA256(password)
},
"first": {
S: first
},
"last": {
S: last
},
"email": {
S: email
},
"affiliation": {
S: affiliation
},
"birthday": {
S: birthday
},
"interests": {
SS: interests
},
"last_active": {
N: timestamp.toString()
}
},
TableName: 'users'
};

db.putItem(params, function (err, data) {
if (err) {
console.log("error occurred while adding user");
callback(err, null);

} else {
console.log("added user successfully");
callback(null, data);
}
});

}

var updateAccount = function(username, newPass, newEmail, newAffiliation, newInterests, callback) {
console.log("updating account of : " + username);

var params;

if (newPass != "") {
params = {
TableName: 'users',
Key: {
'username': {
S: username
}
},
UpdateExpression: 'set password = :p',
ExpressionAttributeValues: {
':p' : {
S: SHA256(newPass)
}
}
}

db.updateItem(params, function(err, data) {
if (err) {
console.log(err);
callback(err, null);
} else {
console.log("successfully updated " + username + "'s password");
//callback(null, data);
}
});
}

if (newEmail != "") {
params = {
TableName: 'users',
Key: {
'username': {
S: username
}
},
UpdateExpression: 'set email = :e',
ExpressionAttributeValues: {
':e' : {
S: newEmail
}
}
}

db.updateItem(params, function(err, data) {
if (err) {
console.log(err);
callback(err, null);
} else {
console.log("successfully updated " + username + "'s email");
//callback(null, data);
}
});
}

if (newAffiliation != "") {
params = {
TableName: 'users',
Key: {
'username': {
S: username
}
},
UpdateExpression: 'set affiliation = :a',
ExpressionAttributeValues: {
':a' : {
S: newAffiliation
}
}
}

db.updateItem(params, function(err, data) {
if (err) {
console.log(err);
callback(err, null);
} else {
console.log("successfully updated " + username + "'s affiliation");
//callback(null, data);
}
});
}

if (newInterests != undefined) {
params = {
TableName: 'users',
Key: {
'username': {
S: username
}
},
UpdateExpression: 'set interests = :i',
ExpressionAttributeValues: {
':i' : {
SS: newInterests
}
}
}

db.updateItem(params, function(err, data) {
if (err) {
console.log(err);
callback(err, null);
} else {
console.log("successfully updated " + username + "'s interests");
//callback(null, data);
}
});
}

callback(null, "success");

}

var addPost = function (content, username, timestamp, author, id, callback) {
console.log('Adding post by: ' + author);
console.log("timestamp: " + timestamp);
console.log('ID IS ' + id);
// Create a new Item, add the username, password, and first name to it, then
// add that item to the users table
var params = {
Item: {
"username": {
S: username
},
"timestamp": {
S: timestamp.toString()
},
"content": {
S: content
},
"author": {
S: author
},
"id": {
S: id
}
},
TableName: 'posts'
};

db.putItem(params, function (err, data) {
if (err) {
console.log("Printing err: " + err);
callback(err, null);

} else {
console.log("Printing data: " + data);
callback(null, data);

}

});

}

var addComment = function(content, timestamp, author, post_id, comment_id, callback) {
console.log("adding comment by: " + author);

var params = {
Item: {
"post_id": {
S: post_id
},
"timestamp": {
S: timestamp.toString()
},
"content": {
S: content
},
"author": {
S: author
},
"comment_id": {
S: comment_id
}
},
TableName: 'comments'
};

db.putItem(params, function (err, data) {
if (err) {
console.log("Printing err: " + err);
callback(err, null);

} else {
console.log("Printing data: " + data);
callback(err, data);

}

});
}

var queryNews = function(keyword, callback) {
var temp = keyword.toLowerCase();
var stop = ['a', 'all', 'any', 'but', 'the'];
  var containsstop = false;
 
  if (stop.includes(temp)) {
containsstop = true;
// redirect or send error message of some sort
}

if (!containsstop) {
var word = stemmer(temp);
var params = {
TableName: "inverted",
ExpressionAttributeValues: {
':w' : word
},
KeyConditionExpression: 'keyword = :w'
}

db.query(params, function(err, data) {
if (err || data.Items.length == 0) {
callback(err, null);
} else {
callback(null, data);
}
});
}

}

var addFriend = function(username1, username2, callback) {
var username1 = username1;
var username2 = username2;

var params1 = {
Item: {
friend1: {
S: username1
},
friend2: {
S: username2
}
},
TableName: "friends",
ReturnValues: 'NONE'
}

var params2 = {
Item: {
friend1: {
S: username2
},
friend2: {
S: username1
}
},
TableName: "friends",
ReturnValues: 'NONE'
}

db.putItem(params1, function(err, data) {
if (err) {
callback(err, null);
} else {
console.log("Successfully Added Friend");
callback(null, 'Success');
}
});

db.putItem(params2, function(err, data) {
if (err) {
callback(err, null);
} else {
console.log("Successfully Added Friend");
callback(null, 'Success');
}
});
}

var getAllComments = function(posts, callback) {
console.log("getting all comments");
/*
var params = {
KeyConditions: {
username: {
ComparisonOperator: 'EQ',
AttributeValueList: [ { S: userid} ]
}
},
TableName: "posts",
ScanIndexForward: false
};

db.query(params, function(err, data) {
if (err) {
console.log(err);
callback(err, null);
} else {
console.log("successfully got " + userid + "'s posts");
var promiseList = [];

for (var i = 0; i < data.Items.length; i++) {
console.log(data.Items.length);
var id = data.Items[i].id.S;
console.log(id);
var params2 = {
KeyConditions: {
post_id: {
ComparisonOperator: 'EQ',
AttributeValueList: [ { S: id} ]
}
},
TableName: 'comments',
AttributesToGet: [ 'post_id', 'timestamp', 'author', 'content' ],
ScanIndexForward: false
};

promiseList.push(db.query(params2).promise());
}

console.log(promiseList.length);
Promise.all(promiseList).then(
successfulDataArray => {
console.log(successfulDataArray);
var res = [];
for (var j = 0; j < successfulDataArray.length; j++) {
//for (var k = 0; k < successfulDataArray[j].length; k++) {}
//if (successfulDataArray.Items[])
console.log("length of array " + successfulDataArray[j].Items.length);
if (successfulDataArray[j].Items.length == 0) {
var r = [];
res.push(r);
} else {
res.push(successfulDataArray[j].Items);
}
//console.log("wtf : " + successfulDataArray[j].Items[0].post_id.S);
//console.log("is this a 2d array ????" + successfulDataArray[j][0]);
//console.log("this is the console log right here " + successfulDataArray[j].post_id);
//res.push(successfulDataArray[j]);
}

//console.log(res);
callback(null, res);
}
);

//callback(null, data);
}
});
*/

var promiseList = [];
for (var i = 0; i < posts.Items.length; i++) {
console.log(posts.Items.length);
var id = posts.Items[i].id.S;
console.log(id);
var params = {
KeyConditions: {
post_id: {
ComparisonOperator: 'EQ',
AttributeValueList: [ { S: id} ]
}
},
TableName: 'comments',
AttributesToGet: [ 'post_id', 'timestamp', 'author', 'content' ],
ScanIndexForward: false
};

promiseList.push(db.query(params).promise());

}
console.log(promiseList.length);
Promise.all(promiseList).then(
successfulDataArray => {
var res = [];
for (var j = 0; j < successfulDataArray.length; j++) {
//for (var k = 0; k < successfulDataArray[j].length; k++) {}
//if (successfulDataArray.Items[])
console.log("length of array " + successfulDataArray[j].Items.length);
if (successfulDataArray[j].Items.length == 0) {
var r = [];
res.push(r);
} else {
res.push(successfulDataArray[j].Items);
}
}

//console.log(res);
callback(null, res);
}
);
}

var checkUser = function(username, password, callback) {
console.log("checking user: " + username);

var params = {
KeyConditions: {
username: {
ComparisonOperator: 'EQ',
AttributeValueList: [ { S: username } ]
}
},
TableName: "users",
AttributesToGet: [ 'password' ]
};

db.query(params, function(err, data) {
if (err || data.Items.length == 0) {
console.log("User doesn't exist");
callback(err, "error1");
} else if (password == null || data.Items[0].password.S == password) {
callback(null, 'Success');
} else {
console.log("User exists, but wrong password");
callback(err, "error2");
}
});
}

var addChatRoom = function(roomID, user1, user2, callback) {
console.log("ARE WE HERE IN CHATROOM PLS");
console.log(user1);
console.log(user2);
var params = {
Item: {
roomId: {
S: roomID
},
user: {
S: user1
}

},
TableName: "chatrooms",
ReturnValues: 'NONE'
}
var params2 = {
Item: {
roomId: {
S: roomID
},
user: {
S: user2
}

},
TableName: "chatrooms",
ReturnValues: 'NONE'
}


db.putItem(params, function(err, data) {
if (err) {
callback(err, null);
} else {
console.log("Successfully Added Chat");
db.putItem(params2, function(err, data2) {
if (err) {
callback(err, null);
}else {
callback(null, 'Success');
}});

}
});
}

var addChatNotif= function(friendReceived, fromFriend, room, callback) {

var params = {
Item: {
receivedByUser: {
S: friendReceived
},
fromUser: {
S: fromFriend
},
roomId: {
S: room
},
},
TableName: "chatnotifs",
ReturnValues: 'NONE'
}

db.putItem(params, function(err, data) {
if (err) {
callback(err, null);
} else {
console.log("Successfully Added Chat Notif");
callback(null, 'Success');
}
});
}

var sendChat = function(roomID, user, msg, timestamp, callback) {
console.log(roomID);
var params = {
Item: {
roomId: {
S: roomID
},
timestamp: {
N: timestamp
},
user: {
S: user
},
msg: {
S: msg
}
},
TableName: "chats",
ReturnValues: 'NONE'
}

db.putItem(params, function(err, data) {
if (err) {
callback(err, null);
} else {
console.log("Successfully Added Chat Message");
callback(null, 'Success');
}
});
}

var checkChat = function(roomID, callback) {

var params = {
KeyConditions: {
roomId: {
ComparisonOperator: 'EQ',
AttributeValueList: [ { S: roomID} ]
}
},
TableName: "chatrooms",
AttributesToGet: ['roomId']
};

db.query(params, function(err, data) {
if (err| data==null) {
console.log("ARE WE here");
callback(err, null);
} else if (data.Items.length == 0) {
console.log("ARE WE here");
callback(err, null);

}
else {
callback(null, data);
}
});
}


var getUsers = function( callback) {
const params = {
   TableName: "users",
       Select: "ALL_ATTRIBUTES"
};

db.scan(params, function(err, data) {
if (err ) {

callback(err, null);
} else {
console.log("data", data.Items[0])
callback(null, data);
}
});
}

var getChat = function(roomID, callback) {

var params = {
KeyConditions: {
roomId: {
ComparisonOperator: 'EQ',
AttributeValueList: [ { S: roomID} ]
}
},
TableName: "chats",
AttributesToGet: ['roomId', 'timestamp', 'msg', 'user']
};

db.query(params, function(err, data) {
if (err| data==null) {
console.log("ARE WE here");
callback(err, null);
} else if (data.Items.length == 0) {

callback(err, null);

}
else {
console.log("we found the items");
console.log(data);
callback(null, data);
}
});
}

var getChatNotif = function(user, callback) {

var params = {
KeyConditions: {
receivedByUser: {
ComparisonOperator: 'EQ',
AttributeValueList: [ { S: user} ]
}
},
TableName: "chatnotifs",
AttributesToGet: ['receivedByUser','fromUser', 'roomId']
};

db.query(params, function(err, data) {
if (err| data==null) {
console.log("ARE WE here");
callback(err, null);
} else if (data.Items.length == 0) {

callback(err, null);

}
else {
console.log("we found the items");
console.log("from db");
console.log(data.Items);console.log(data);
callback(null, data);
}
});
}

var getPosts = function(username, callback) {
console.log("getting posts for: " + username);

var params = {
KeyConditions: {
username: {
ComparisonOperator: 'EQ',
AttributeValueList: [ { S: username} ]
}
},
TableName: "posts",
ScanIndexForward: false
};

db.query(params, function(err, data) {
if (err) {
console.log(err);
callback(err, null);
} else {
console.log("successfully got " + username + "'s posts");

callback(null, data);
}
});
}

var getComments = function(id, callback) {
console.log("getting comments for post: " + id);

var params = {
KeyConditions: {
post_id: {
ComparisonOperator: 'EQ',
AttributeValueList: [ { S: id} ]
}
},
TableName: "comments",
AttributesToGet: ['content','timestamp','author'],
ScanIndexForward: false
};

db.query(params, function(err, data) {
if (err) {
console.log(err);
callback(err, null);
} else {
console.log("successfully got post " + id + "'s comments");

callback(null, data);
}
});
}

/*
var getAllPostsComments = function(userid, callback) {
console.log("getting all posts and comments for : " + userid);

var params = {
KeyConditions: {
username: {
ComparisonOperator: 'EQ',
AttributeValueList: [ { S: userid} ]
}
},
TableName: "posts",
ScanIndexForward: false
}

var promises1 = [];
promises1.push(db.query(params).promise());
var promises2 = [];

const post_ids = new Set();
Promises.all(promises1).then(
successfulDataArray => {
for (var i = 0; i < successfulDataArray.length; i++) {
//talk_ids.add(successfulDataArray[i].Items[j].inxid);
post_ids.add(successfulDataArray[i].Items[])
}
}
)

db.query(params, function(err, data) {
if (err) {
console.log(err);
callback(err, null);
} else {
console.log("successfully got " + userid + "'s posts");
var promiseList = [];

for (var i = 0; i < data.Items.length; i++) {
var p_id = data.Items[i].username.S + data.Items[i].timestamp.S;
console.log(p_id);
var params2 = {
KeyConditions: {
post_id: {
ComparisonOperator: 'EQ',
AttributeValueList: [ { S: p_id } ]
}
},
TableName: 'comments'
}

promiseList.push(db.query(params2).promise());
}

// Promise.all(promiseList).then() => {callback of route }
Promise.all(promiseList).then(
successfulDataArray => {
var res = [];
console.log(successfulDataArray[0].Items);

//console.log(res);
callback(null, res);
}
);

//callback(null, data);
}
})
}*/


var updateActive = function(username, timestamp, callback) {
console.log("updating last active status of " + username);

var params = {
TableName: 'users',
Key: {
"username": {
S: username
}
},
UpdateExpression: 'set last_active = :t',
ExpressionAttributeValues: {
':t': {
N: timestamp.toString()
}
}
};

db.updateItem(params, function(err, data) {
if (err) {
console.log(err);
callback(err, null);
} else {
console.log("successfully updated " + username + "'s active status");
callback(null, data);
}
});
}



var sendGroupChat = function(roomID, user1, user2, user3, timestamp, groupName, callback) {
console.log("WHAT IS GOING ON");
console.log(user1);
console.log(user2);
console.log(user3);
console.log(timestamp);
console.log(groupName);
var params1 = {
Item: {
user: {
S: user1
},
timestamp: {
N: timestamp
},
roomId: {
S: roomID
},
invitedBy: {
S: user1
},
groupName: {
S: groupName
}
},
TableName: "groupchats",
ReturnValues: 'NONE'
};
var params2 = {
Item: {
user: {
S: user2
},
timestamp: {
N: timestamp
},
roomId: {
S: roomID
},
invitedBy: {
S: user1
},
groupName: {
S: groupName
}
},
TableName: "groupchats",
ReturnValues: 'NONE'
};
var params3 = {
Item: {
user: {
S: user3
},
timestamp: {
N: timestamp
},
roomId: {
S: roomID
},
invitedBy: {
S: user1
},
groupName: {
S: groupName
}
},
TableName: "groupchats",
ReturnValues: 'NONE'
};

db.putItem(params1, function(err, data) {
if (err) {
callback(err, null);
} else {
db.putItem(params2, function(err, data) {
if (err) {
callback(err, null);
} else {
db.putItem(params3, function(err, data) {
if (err) {
callback(err, null);
} else {
console.log("Successfully Added Chat Message");
callback(null, 'Success');
}
});
}
});
}
});
}

var sendGroupChatToOtherTable = function(roomID, user1, user2, user3, groupName, callback) {
console.log("we came to this");
console.log(user1);
console.log(user2);
console.log(user3);

var params11 = {
Item: {
roomId: {
S: roomID
},
user: {
S: user1
},
groupName: {
S: groupName
}
},
TableName: "groupchatsById",
ReturnValues: 'NONE'
};
var params12 = {
Item: {
roomId: {
S: roomID
},
user: {
S: user2
},
groupName: {
S: groupName
}
},
TableName: "groupchatsById",
ReturnValues: 'NONE'
};
var params13 = {
Item: {
roomId: {
S: roomID
},
user: {
S: user3
},
groupName: {
S: groupName
}
},
TableName: "groupchatsById",
ReturnValues: 'NONE'
};

db.putItem(params11, function(err, data) {
if (err) {
callback(err, null);
} else {
db.putItem(params12, function(err, data) {
if (err) {
callback(err, null);
} else {
db.putItem(params13, function(err, data) {
if (err) {
callback(err, null);
} else {
console.log("Successfully Added Chat Message");
callback(null, 'Success');
}
});
}
});
}
});
}

var addGroupMemToOtherTable = function(roomID, user, groupName, callback) {
var params = {
Item: {
roomId: {
S: roomID
},
user: {
S: user
},
groupName: {
S: groupName
}


},
TableName: "groupchatsById",
ReturnValues: 'NONE'
};

db.putItem(params, function(err, data) {
if (err) {
callback(err, null);
} else {
console.log("Successfully Added Chat Message");
callback(null, 'Success');
}

});
}

var addGroupMem = function(roomID, user, userI, timestamp, groupName, callback) {
console.log(roomID);
var params = {
Item: {
user: {
S: user
},
timestamp: {
N: timestamp
},
roomId: {
S: roomID
},
invitedBy: {
S: userI
},
groupName: {
S: groupName
}
},
TableName: "groupchats",
ReturnValues: 'NONE'
};

db.putItem(params, function(err, data) {
if (err) {
callback(err, null);
} else {
console.log("Successfully Added Chat Message");
callback(null, 'Success');
}

});
}

var getGroupMembers = function(room, callback) {
console.log("getting posts for: " + username);

var params = {
KeyConditions: {
roomId: {
ComparisonOperator: 'EQ',
AttributeValueList: [ { S: room} ]
}
},
TableName: "groupchatsById",
AttributesToGet: ['user']
};

db.query(params, function(err, data) {
if (err) {
console.log(err);
callback(err, null);
} else {
console.log(data);
callback(null, data);
}
});
}

var getGroupNotifs = function(username, callback) {

var params = {
KeyConditions: {
user: {
ComparisonOperator: 'EQ',
AttributeValueList: [ { S: username} ]
}
},
ScanIndexForward: false,
TableName: "groupchats",
AttributesToGet: ['user', 'roomId', 'invitedBy', 'groupName']
};
db.query(params, function(err, data) {
if (err) {
console.log(err);
callback(err, null);
} else {
console.log(data);
callback(null, data);
}
});
}

var getActiveFriends = function(username, timestamp, callback) {
console.log("getting active friends of " + username);

var params = {
KeyConditions: {
friend1: {
ComparisonOperator: 'EQ',
AttributeValueList: [ { S : username } ]
}
},
TableName: 'friends',
AttributesToGet: ['friend2']
}

db.query(params, function(err, data) {
if (err) {
console.log(err);
callback(err, null);
} else {
console.log("successfully got " + username + "'s friends");
console.log(data.Items);
var promiseList = [];

for (var i = 0; i < data.Items.length; i++) {
var params2 = {
KeyConditions: {
username: {
ComparisonOperator: 'EQ',
AttributeValueList: [ { S: data.Items[i].friend2.S } ]
}
},
TableName: 'users'
}

promiseList.push(db.query(params2).promise());
}

// Promise.all(promiseList).then() => {callback of route }
Promise.all(promiseList).then(
successfulDataArray => {
var res = [];
for (var j = 0; j < successfulDataArray.length; j++) {
var temp = successfulDataArray[j].Items[0].last_active.N;
console.log(timestamp-temp);
if (timestamp - temp <= 600000) {
res.push(successfulDataArray[j].Items[0]);
}
}

//console.log(res);
callback(null, res);
}
);

}
});

}

var addLikedArticle = function (user, link, callback) {
console.log("Article " + link + " liked by " + user + "; adding to likedArticles table");

var params = {
Item: {
user: {
S: user
},
link: {
S: link
}
},
TableName: "likedArticles",
ReturnValues: 'NONE'
};

db.putItem(params, function (err, data) {
if (err) {
callback(err, null);
} else {
console.log("Successfully added liked article to table");
callback(null, 'Success');
}
});

}

var getDetails = function(username, callback) {

  var params = {
KeyConditions: {
username: {
ComparisonOperator: 'EQ',
AttributeValueList: [ { S: username} ]
},},
TableName: 'users'
  };

  db.query(params, function(err, data) {
    if (err || data.Items.length == 0) {
console.log("are we here no");
    callback(err, null);
    } else {
console.log("are we here yes");
console.log(data);
    callback(null, data);
    }
  });
}

var getUserData = function(username, callback) {
var params = {
KeyConditions: {
username: {
ComparisonOperator: 'EQ',
AttributeValueList: [ { S: username } ]
}
},
TableName: 'users',
AttributesToGet: ['affiliation', 'first']
}

db.query(params, function(err, data) {
if (err || data.Items.length == 0) {
callback(err, null);
} else {
callback(null, data);
}
});
}

var viewFriends = function(username, callback) {
var params = {
KeyConditions: {
friend1: {
ComparisonOperator: 'EQ',
AttributeValueList: [ { S: username} ]
}
},
TableName: "friends",
AttributesToGet: ['friend2']
};

db.query(params, function(err, data) {
if (err) {
console.log(err);
callback(err, null);
} else {
callback(null, data);
}
});
}

var getFriends = function(username, affiliation, callback) {
console.log("getting friends for: " + username);

var params = {
KeyConditions: {
friend1: {
ComparisonOperator: 'EQ',
AttributeValueList: [ { S: username} ]
}
},
TableName: "friends",
AttributesToGet: ['friend2']
};

db.query(params, function(err, data) {
if (err) {
console.log(err);
callback(err, null);
} else {
var promiseList = [];

for (var i = 0; i < data.Items.length; i++) {
var params2 = {
KeyConditions: {
username: {
ComparisonOperator: 'EQ',
AttributeValueList: [ { S: data.Items[i].friend2.S } ]
}
},
TableName: 'users',
AttributesToGet: ['first', 'username', 'affiliation']
}

promiseList.push(db.query(params2).promise());
}

// Promise.all(promiseList).then() => {callback of route }
Promise.all(promiseList).then(
successfulDataArray => {
var res = [];
for (var j = 0; j < successfulDataArray.length; j++) {
if (affiliation == null) {
res.push(successfulDataArray[j].Items[0]);
} else {
if (successfulDataArray[j].Items[0].affiliation.S == affiliation) {
res.push(successfulDataArray[j].Items[0]);
}
}

}

console.log(res);
callback(null, res);
}
);
}
});
}

var getPeopleNotInGC = function(username, room, timestamp, callback) {
console.log("DID WE REACH HERE????");
var params = {
KeyConditions: {
friend1: {
ComparisonOperator: 'EQ',
AttributeValueList: [ { S : username } ]
}
},
TableName: 'friends',
AttributesToGet: ['friend2']
}
var paramsfriend = {
KeyConditions: {
roomId: {
ComparisonOperator: 'EQ',
AttributeValueList: [ { S: room} ]
}
},
TableName: "groupchatsById",
AttributesToGet: ['user']
};

db.query(params, function(err, data) {
if (err) {
console.log(err);
callback(err, null);
} else {
console.log("successfully got " + username + "'s friends");
console.log(data.Items);
var promiseList = [];

for (var i = 0; i < data.Items.length; i++) {
var params2 = {
KeyConditions: {
username: {
ComparisonOperator: 'EQ',
AttributeValueList: [ { S: data.Items[i].friend2.S } ]
}
},
TableName: 'users'
}

promiseList.push(db.query(params2).promise());
}

// Promise.all(promiseList).then() => {callback of route }
Promise.all(promiseList).then(
successfulDataArray => {
var res = [];
for (var j = 0; j < successfulDataArray.length; j++) {
var temp = successfulDataArray[j].Items[0].last_active.N;
console.log(timestamp-temp);
if (timestamp - temp <= 600000) {
res.push(successfulDataArray[j].Items[0]);
}
}

db.query(paramsfriend, function(err, dataGC) {
if (err) {
console.log(err);
callback(err, null);
} else {
toRet = [];
for (var i = 0; i < res.length; i++) {
var check = 0;
for (var j = 0; j < dataGC.Items.length; j++) {
if (dataGC.Items[j].user.S === res[i].username.S) {
check = 1;
console.log(dataGC.Items[j].user.S);
}
}
if (check ===0) {
toRet.push(res[i].username.S);
}
}
callback(null, toRet);
}
});
}
);

}
});

}
var getPeopleNotInChat = function(username, room, timestamp, callback) {
console.log("DID WE REACH HERE????");
var params = {
KeyConditions: {
friend1: {
ComparisonOperator: 'EQ',
AttributeValueList: [ { S : username } ]
}
},
TableName: 'friends',
AttributesToGet: ['friend2']
}
var paramsfriend = {
KeyConditions: {
roomId: {
ComparisonOperator: 'EQ',
AttributeValueList: [ { S: room} ]
}
},
TableName: "chatrooms",
AttributesToGet: ['user']
};

db.query(params, function(err, data) {
if (err) {
console.log(err);
callback(err, null);
} else {
console.log("successfully got " + username + "'s friends");
console.log(data.Items);
var promiseList = [];

for (var i = 0; i < data.Items.length; i++) {
var params2 = {
KeyConditions: {
username: {
ComparisonOperator: 'EQ',
AttributeValueList: [ { S: data.Items[i].friend2.S } ]
}
},
TableName: 'users'
}

promiseList.push(db.query(params2).promise());
}

// Promise.all(promiseList).then() => {callback of route }
Promise.all(promiseList).then(
successfulDataArray => {
var res = [];
for (var j = 0; j < successfulDataArray.length; j++) {
var temp = successfulDataArray[j].Items[0].last_active.N;
console.log(timestamp-temp);
if (timestamp - temp <= 600000) {
res.push(successfulDataArray[j].Items[0]);
}
}

db.query(paramsfriend, function(err, dataGC) {
if (err) {
console.log(err);
callback(err, null);
} else {
toRet = [];
for (var i = 0; i < res.length; i++) {
var check = 0;
for (var j = 0; j < dataGC.Items.length; j++) {
if (dataGC.Items[j].user.S === res[i].username.S) {
check = 1;
console.log(dataGC.Items[j].user.S);
}
}
if (check ===0) {
toRet.push(res[i].username.S);
}
}
console.log("THE RESULTS ARE");
console.log(toRet);
callback(null, toRet);
}
});
}
);

}
});

}

var lookupPost = function(poster, timestamp, callback) {
console.log('Looking up: ' + poster + " " + timestamp);

  var params = {
      KeyConditions: {
        username: {
          ComparisonOperator: 'EQ',
          AttributeValueList: [ { S: poster } ]
        }
      },
      TableName: "posts"
  };

  db.query(params, function(err, data) {
    if (err || data.Items.length == 0) {
      callback(err, null);
    } else {
var res;
for (var i = 0; i < data.Items.length; i++) {
if (data.Items[i].timestamp.S == timestamp) {
res = data.Items[i];
}
}


      callback(null, res);
    }
  });
}

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
					console.log(successfulDataArray);
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

var getFriendComments = function(posts, callback) {
	console.log("getting all comments");
	
	var promiseList = [];
	for (var i = 0; i < posts.length; i++) {
		for (var j = 0; j < posts[i].length; j++) {
			var id = posts[i][j].id.S;
			console.log(id);
			var params = {
			KeyConditions: {
				post_id: {
				ComparisonOperator: 'EQ',
				AttributeValueList: [ { S: id} ]
				}
			},
			TableName: 'comments',
			AttributesToGet: [ 'post_id', 'timestamp', 'author', 'content' ],
			ScanIndexForward: false
			};
		
			promiseList.push(db.query(params).promise());
		}
		//console.log(posts.Items.length);
		//var id = posts[i].Itemsid.S;
		//console.log(id);
		
		
	}
	
	console.log(promiseList.length);
	Promise.all(promiseList).then(
				successfulDataArray => {
					var res = [];
					for (var j = 0; j < successfulDataArray.length; j++) {
						//for (var k = 0; k < successfulDataArray[j].length; k++) {}
						//if (successfulDataArray.Items[])
						console.log("length of array " + successfulDataArray[j].Items.length);
						if (successfulDataArray[j].Items.length == 0) {
							console.log("zero comments");
							var r = [];
							res.push(r);
						} else {
							res.push(successfulDataArray[j].Items);
						}
					}
					
					console.log("res " + res);
					callback(null, res);
				}
	);
	
	
}

var database = {
  look_up: usernameLookup,
  add_user: addUser,
  query_news: queryNews,
  add_friend: addFriend,
  add_post: addPost,
  check_user: checkUser,
  get_friends: getFriends,
  add_chatroom: addChatRoom,
  check_chat: checkChat,
  send_chat:sendChat,
  get_chat: getChat,
  add_chatnotif:addChatNotif,
  get_chatnotif:getChatNotif,
  get_posts: getPosts,
  update_active: updateActive,
  get_active_friends: getActiveFriends,
  send_groupchat: sendGroupChat,
  send_groupchat_other: sendGroupChatToOtherTable,
  add_group_mem: addGroupMem,
  addgroupmem_other: addGroupMemToOtherTable,
  get_group_mems: getGroupMembers,
  get_group_notifs: getGroupNotifs,
  get_users: getUsers,
  update_account: updateAccount,
  like_article: addLikedArticle,
  get_details: getDetails,
  get_user_data: getUserData,
  get_not_in_gc: getPeopleNotInGC,
  get_not_in_chat: getPeopleNotInChat,
  add_comment: addComment,
  get_comments: getComments,
  view_friends: viewFriends,
  lookup_post: lookupPost,
  get_all_comments: getAllComments,
  get_all_friend_posts: getAllFriendPosts,
  get_friend_comments: getFriendComments
  //get_all_posts_comments: getAllPostsComments

};

module.exports = database;



	
