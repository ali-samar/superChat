/* Serveur */

var express = require('express');
var app = express();
var	server = require('http').createServer(app);
var	io = require('socket.io').listen(server);
var	ent = require('ent'); // permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)
var	fs = require('fs');
var users = {};

// Chargement de la page index.html
app.use(express.static(__dirname + '/public'));

io.sockets.on('connection', function (socket, pseudo){
	/* Dès qu'on nous donne un pseudo, on le stocke
	 ** en variable de session et on informe les autres
	 */
	socket.on('nouveau_client', function (pseudo) {
		pseudo = ent.encode(pseudo);
		socket.pseudo = pseudo;
		socket.broadcast.emit('nouveau_client', pseudo);
		users[pseudo]={name:pseudo, id:socket.id};
		socket.emit('connected', users); // envoi à moi 
		socket.broadcast.emit('connected', users); // envoi à tous 
	});

	socket.on('disconnect', function () {
		for (var user in users) {
			if (users[user].id == socket.id) {
				delete users[user];
			}
		}
		socket.broadcast.emit('connected', users);
	});

	/* Dès qu'on reçoit un message, on récupère le 
	 ** pseudo de son auteur et on le transmet aux autres
	 */
	socket.on('message', function (message) {
		message = ent.encode(message);
		var reg = new RegExp("((http://)|(https://)[a-zA-Z0-9/.]+)+","gi");
        var linkifed = message.replace(reg, "<a href='$1' target=_blank>$1</a>");
        var date = new Date();
        var dateString = date.toLocaleDateString() + " " + date.toLocaleTimeString();
		socket.broadcast.emit('message', {pseudo: socket.pseudo, message: linkifed, dateString: dateString});
	});


});

server.listen(3000);