
;(function () {
    const socket = io();
    let deltaTime = 0;
    let prevTFrame = 0;
    let timeStep = 1/60;

    let mainCanvas = document.getElementById("mainCanvas");
    mainCanvas.width = window.innerWidth;
    mainCanvas.height = window.innerHeight;
    let canvasContext = mainCanvas.getContext("2d");  
    
    let circleX = 100;
    let circleY = 100;
    let speed = 1;
    
    let currentTick = 0;
    let recievedTicks = [];  

    main();    

    function main(   tFrame ) {
        
        window.stopMain = window.requestAnimationFrame( main );
        
        deltaTime += (tFrame - prevTFrame) / 1000;
        prevTFrame = tFrame;
        if(!deltaTime){            
            deltaTime = 0;
        }

        let counter = 0;
        while(deltaTime >= timeStep && counter < 4){
            if(recievedTicks){
                update( timeStep ); 
                deltaTime -= timeStep;
            }            
            
            //counter++;
        }
        
        render();
    }

    function update(deltaTime){
        if(circleX >= mainCanvas.width - 100){
            speed = -1;
        }
        if(circleX <= 100){
            speed = 1;
        }
        circleX += speed;
    }

    function render(){
        canvasContext.clearRect(0,0, mainCanvas.width, mainCanvas.height);         
        drawCircle(circleX,circleY, 50, "blue");
    }

    function drawCircle(x,y,radius, color){
        canvasContext.beginPath();
        canvasContext.fillStyle = color;
        canvasContext.arc(x, y, radius, 0 , 2 * Math.PI);
        canvasContext.fill();
    }
    
  })();