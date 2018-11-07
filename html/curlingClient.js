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

let rockPlayed
let deltaX, deltaY

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

function collisionBetween(rock1, rock2) {
	if(Math.pow((Math.pow(rock1.x-rock2.x,2)+Math.pow(rock1.y-rock2.y, 2)), 0.5) <= 2*ROCK_RADIUS) {
		return true
	}
	else { return false}
}

function resolveCollision(rock1, rock2) {
	return
}

function checkForCollisions() {
	rocks.sort(function(a,b) {
		return a.y - b.y
	})
	
	for (let i=0; i<rocks.length-1; i++) {
		if (rocks[i+1].y - rocks[i].y <= 2*ROCK_RADIUS) {
			if (collisionBetween(rocks[i], rocks[i+1])) {
				resolveCollision(rocks[i], rocks[i+1])
			}
		}
		
	}
}

function watchGame() {
	socket.emit("watchGame", function(res) {
		isPlayer = res.isPlayer
		connectMouseListener(res.IsPlayer)
	})
}

function joinGame() {
	socket.emit("playGame")
	isPlayer = true
	connectMouseListener(true)
	document.getElementById('joinButton').disabled = true
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
	context.lineWidth = 18.75
	
	context.beginPath()
	context.arc(zoom_x, zoom_y, 25, 0, 2* Math.PI, true)
	context.strokeStyle = 'red'
	context.stroke()
	
	context.beginPath()
	context.arc(zoom_x, zoom_y, 62.5, 0, 2*Math.PI, true)
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
  let canvasX = e.clientX - rect.left //use jQuery event object clientX and clientY
  let canvasY = e.clientY - rect.top
  console.log("mouse down:" + canvasX + ", " + canvasY)

  // Find if player clicked on a rock
  for (let i = 0; i < rocks.length; i++) {

	  let rock = rocks[i]
	  if (Math.abs(canvasX - rock.x) <= ROCK_RADIUS && Math.abs(canvasY - rock.y) <= ROCK_RADIUS) {
		  console.log(rock)
		  rockPlayed = rock
		  break
	  }
  }
  
  if (rockPlayed != null) {
	  
	deltaX = rockPlayed.x - canvasX
    deltaY = rockPlayed.y - canvasY
	$("#curlingFullCanvas").mousemove(handleMouseMove)
    $("#curlingFullCanvas").mouseup(handleMouseUp)
	  
  }
  
  
  e.stopPropagation()
  e.preventDefault()
  
  drawCanvas()
}

function handleMouseMove(e) {

  console.log("mouse move")

  //get mouse location relative to canvas top left
  let rect = mainCanvas.getBoundingClientRect()
  let canvasX = e.clientX - rect.left
  let canvasY = e.clientY - rect.top

  rockPlayed.x = canvasX + deltaX
  rockPlayed.y = canvasY + deltaY

  e.stopPropagation()

  drawCanvas()
}

function handleMouseUp(e) {
  console.log("mouse up")
  

  e.stopPropagation()

  //$("#curlingFullCanvas").off(); //remove all event handlers from canvas
  //$("#curlingFullCanvas").mousedown(handleMouseDown); //add mouse down handler

  //remove mouse move and mouse up handlers but leave mouse down handler
  $("#curlingFullCanvas").off("mousemove", handleMouseMove) //remove mouse move handler
  $("#curlingFullCanvas").off("mouseup", handleMouseUp) //remove mouse up handler

  drawCanvas() //redraw the canvas
}

$(document).ready(function() {
  //This is called after the broswer has loaded the web page

  timer = setInterval(handleTimer, 100)
  //clearTimeout(timer) //to stop
  
  // Add initial rocks
  rocks.push({ colour:'red', x: 25, y: 500, played: false})
  rocks.push({ colour: 'yellow', x: 40, y: 150, played: false})
  rocks.push({ colour: 'red', x:70, y:50, played: false})
  rocks.push({ colour: 'yellow', x:70, y:60, played: false})
  rocks.push({ colour: 'red', x:60, y:80, played: false})
  rocks.push({ colour: 'yellow', x:59, y:300, played: false})

  drawCanvas()
  
})

