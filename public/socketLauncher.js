

const SOCKETCHANNELS = {
    connection : "connect",
    input : "input"
};

const SOCKETEVENTS = {
    userConnected : "user connected",
    userDisconnected : "user disconnected",
    startGame : "start game"
};

let tickMap = new Map();

let usersConnected = 0;
let gameStarted = false;

let mainCanvas = document.getElementById("mainCanvas");
mainCanvas.addEventListener("pointerup", (data) => { onPointerUp(data); });
let clickX = 500;
let clickY = 500;

let circles = [];

const socket = io();

let players = [];

function onPointerUp(data){
    console.log('click');
    clickX = data.clientX;
    clickY = data.clientY;
    console.log("click x: " + clickX + " | click y: " + clickY);
}

socket.on("socketChannel", message => {    
    if(message.header === SOCKETEVENTS.userConnected){
        console.log("a user connected");
        players = message.data;
        console.log(players);
        usersConnected++;
    }
    if(message.header === SOCKETEVENTS.userDisconnected){
        console.log("a user disconnected");
        gameStarted = false;
        usersConnected--;
    }

    if(message.header === SOCKETEVENTS.startGame && !gameStarted){
        console.log("starting game");
        gameStarted = true;
        usersConnected = 2;
        let counter = 0;
        for(let player of players){
            counter++;
            let circle = createCircle(player.socketId, 100, 100, 50, counter, player.color);
            circles.push(circle);
        }
        gameLoop();
    }
});

function createCircle(owner, x, y, radius, speed, color){
    return {
        owner: owner,
        x: x,
        y: y,
        radius: radius, 
        speed: speed,
        color: color,
        targetX: 500,
        targetY: 100
    };
}

socket.on("tickChannel", message =>{
    //pushFakeTick(message.tickNumber, message.clientId);
    pushTick(message.tickNumber, message.clientId, message.inputs);
});

function pushFakeTick(tickNumber, clientId){
    if(!tickMap.has(tickNumber)){
        tickMap.set(tickNumber, new Map());
    }    
    let tick = tickMap.get(tickNumber);
    if(tick.has(clientId)){
        return;
    }
    tick.set(clientId, undefined);
}

function pushTick(tickNumber, clientId, inputs){
    if(!tickMap.has(tickNumber)){
        tickMap.set(tickNumber, new Map());
    }
    let tick = tickMap.get(tickNumber);
    if(tick.has(clientId)){
        return;
    }
    tick.set(clientId, inputs);
}

function gameLoop() {
    console.log("game loop");
    
    let deltaTime = 0;
    let prevTFrame = 0;
    let timeStep = 1/60;

    mainCanvas.width = window.innerWidth;
    mainCanvas.height = window.innerHeight;
    let canvasContext = mainCanvas.getContext("2d");      
    
    pushFakeTick(0, Math.random());
    pushFakeTick(0, Math.random());        
    
    let currentTick = 0;

    main();    

    function main(   tFrame ) {
        window.stopMain = window.requestAnimationFrame( main );
        deltaTime += (tFrame - prevTFrame) / 1000;
        prevTFrame = tFrame;
        if(!deltaTime){            
            deltaTime = 0;
        }

        let tickReady = tickMap.has(currentTick) && tickMap.get(currentTick).size === usersConnected;
        if(tickReady){            
            let tick = tickMap.get(currentTick);
            for(let player of players){
                let inputs = tick.get(player.socketId);
                if(inputs){
                    for(let circle of circles){
                        if(circle.owner === player.socketId){
                            circle.targetX = inputs.x;
                            circle.targetY = inputs.y;
                        }
                    }
                }
            }
            update( timeStep );
            currentTick += 1;
            let input = undefined;
            if(clickX && clickY){
                input = {x: clickX, y: clickY};
            }
            let tickMessage = {
                tickNumber: currentTick,
                inputs: input
            };
            socket.emit("tickComplete", tickMessage);
            clickX = undefined;
            clickY = undefined;
        }
        
        render();
    }

    function update(deltaTime){
        for(let circle of circles){
            if(circle.targetX  && circle.targetY){
                if(findDistanceSq(circle.x, circle.y, circle.targetX, circle.targetY) <= circle.speed * circle.speed){
                    circle.x = circle.targetX;
                    circle.y = circle.targetY;
                    circle.targetX = undefined;
                    circle.targetY = undefined;
                }else{
                    let direction = findDirection(circle.targetX, circle.targetY, circle.x, circle.y);
                    circle.x += direction.x * circle.speed;
                    circle.y += direction.y * circle.speed;
                }            
            }            
        }              
    }

    function findMagnitude(x, y){
        return Math.abs(Math.sqrt(x*x + y*y));
    }

    function findDistance(x1, y1, x2, y2){
        return Math.sqrt(findDistance(x1, x2, y1, y2));
    }

    function findDistanceSq(x1, y1, x2, y2){
        let x = x1 - x2;
        let y = y1 - y2;
        return x*x + y*y;
    }

    function findDirection(x1, y1, x2, y2){
        let x = x1 - x2;
        let y = y1 - y2;
        let mag = findMagnitude(x, y);
        if(mag != 0){
            x = x/mag;
            y = y/mag;
        }        

        return {
            x: x,
            y: y
        };
    }

    function render(){
        canvasContext.clearRect(0,0, mainCanvas.width, mainCanvas.height); 
        for(let circle of circles){            
            drawCircle(circle.x, circle.y, circle.radius, circle.color);
        }
    }

    function drawCircle(x,y,radius, color){
        canvasContext.beginPath();
        canvasContext.fillStyle = color;
        canvasContext.arc(x, y, radius, 0 , 2 * Math.PI);
        canvasContext.fill();
    }    
    
  }