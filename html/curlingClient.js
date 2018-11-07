/*
/  Client-side code
/
*/

const mainCanvas = document.getElementById('curlingFullCanvas')
const zoomedCanvas = document.getElementById('curlingCloseUp')

const mainCanvasHeight = mainCanvas.height
const mainCanvasWidth = mainCanvas.width

let rocks = []
const ROCK_RADIUS = 12
const ZOOM_ROCK_RADIUS = 4*ROCK_RADIUS
let isPlayer = false
let socket = io("http://" + window.document.location.host)

socket.on("playGame", function(data) {
	let retData = JSON.parse(data)
	isPlayer = retData.isPlayer
	if (!isPlayer) {
		connectMouseListener(false)
	}
	else {
		connectMouseListener(true)
	}
	console.log(isPlayer)
})

function watchGame() {
	socket.emit("watchGame")
	isPlayer = false
	connectMouseListener(false)
}

function connectMouseListener(choice) {
	if(choice) {
		$("#curlingFullCanvas").mousedown(handleMouseDown)
	}
	else {
		$("#curlingFullCanvas").off("mousedown", handleMouseDown); //remove mouse move handler
	}
}

function drawCanvas() {
	// Display the button in the main canvas 
	let context = zoomedCanvas.getContext('2d')
	context.clearRect(0, 0, zoomedCanvas.width, zoomedCanvas.height)
	
	let zoom_x = 300
	let zoom_y = 300
	context.lineWidth = 75
	
	context.beginPath()
	context.arc(zoom_x, zoom_y, 100, 0, 2* Math.PI, true)
	context.strokeStyle = 'red'
	context.stroke()
	
	context.beginPath()
	context.arc(zoom_x, zoom_y, 250, 0, 2*Math.PI, true)
    context.strokeStyle = 'blue'
	context.stroke()
	
	
	// Display the button in the rink view
	context = mainCanvas.getContext('2d')
	context.clearRect(0, 0, mainCanvas.width, mainCanvas.height)
	
	zoom_x = 75
	zoom_y = 75
	context.lineWidth = 15
	
	context.beginPath()
	context.arc(zoom_x, zoom_y, 20, 0, 2* Math.PI, true)
	context.strokeStyle = 'red'
	context.stroke()
	
	context.beginPath()
	context.arc(zoom_x, zoom_y, 50, 0, 2*Math.PI, true)
    context.strokeStyle = 'blue'
	context.stroke()
	
	// Draw rocks
	for (let i = 0; i < rocks.length; i++) {
		let rock = rocks[i]
		context.beginPath()
		context.arc(rock.x, rock.y, ROCK_RADIUS, 0, 2*Math.PI, true)
		context.lineWidth = 5
		context.fillStyle = rock.colour
		context.fill()
		context.strokeStyle = 'grey'
		context.stroke()
		
		if (rock.y <= 150) {
			context = zoomedCanvas.getContext('2d')
			context.beginPath()
			context.arc(rock.x*4, rock.y*4, ZOOM_ROCK_RADIUS, 0, 2*Math.PI, true)
			context.lineWidth = 20
			context.fillStyle = rock.colour
			context.fill()
			context.strokeStyle = 'grey'
			context.stroke()
			
		}
		
		
		context = mainCanvas.getContext('2d')
	}
	
}


function handleTimer() {

  drawCanvas()
}

function handleMouseDown(e) {
  
  //get mouse location relative to canvas top left
  let rect = mainCanvas.getBoundingClientRect()
  //var canvasX = e.clientX - rect.left
  //var canvasY = e.clientY - rect.top
  let canvasX = e.clientX - rect.left //use jQuery event object pageX and pageY
  let canvasY = e.clientY - rect.top
  console.log("mouse down:" + canvasX + ", " + canvasY)
  
  drawCanvas()
}

$(document).ready(function() {
  //This is called after the broswer has loaded the web page

  //add mouse down listener to our canvas object
  connectMouseListener(true)
  
  timer = setInterval(handleTimer, 100)
  //clearTimeout(timer) //to stop
  
  // Add initial rocks
  rocks.push({ colour:'red', x: 25, y: 500})
  rocks.push({ colour: 'yellow', x: 40, y: 525})
  rocks.push({ colour: 'red', x:70, y:50})
  rocks.push({ colour: 'yellow', x:70, y:60})
  rocks.push({ colour: 'red', x:60, y:80})
  rocks.push({ colour: 'yellow', x:59, y:300})

  socket.emit("playGame")
  drawCanvas()
  
})

