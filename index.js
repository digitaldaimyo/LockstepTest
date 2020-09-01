const SOCKETEVENTS = {
    userConnected : "user connected",
    userDisconnected : "user disconnected",
    startGame : "start game"
};

let players = new Map();

const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const path = require("path");
const socketio = require("socket.io");
const io = socketio(server);

const PORT = 3000 || process.env.PORT;

let usersConnected = 0;

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", socket => {
    let colorString = "";
    if(players.size === 0){
        colorString = "blue";
    }else{
        colorString = "red";
    }
    let player = createPlayer(players.size, socket.id, colorString);    
    players.set(player.id, player);
    console.log(Array.from(players.values()));    
    io.emit("socketChannel", createMessage(SOCKETEVENTS.userConnected, Array.from(players.values())));
    usersConnected++;
    
    if(usersConnected >= 2){
        io.emit("socketChannel", createMessage(SOCKETEVENTS.startGame, undefined));
    }

    socket.on("tickComplete", (msg) =>{
        let tickMessage = {
            tickNumber : msg.tickNumber,
            clientId : socket.id,
            inputs: msg.inputs
        };
        io.emit("tickChannel", tickMessage);
    });

    socket.on("tickInput", (msg) =>{
        let tickMessage = {
            tickNumber : msg.tickNumber + 1,
            clientId : socket.id,
            input : "nothing"
        };        
        io.emit("tickChannel", tickMessage);
    });

    socket.on("disconnect", () =>{
        console.log("websocket disconnected");
        usersConnected--;
        io.emit("socketChannel", createMessage(SOCKETEVENTS.userDisconnected, undefined));
    });

});

server.listen(PORT, () => {
    console.log("listening on port " + PORT);
});

function createPlayer(playerId, socketId, colorString){
    let player = {
        id: playerId,
        socketId: socketId,
        color: colorString
    };

    return player;
}

function createMessage(header, data){
    return {
        header: header,
        data: data
    };
}