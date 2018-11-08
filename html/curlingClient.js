/*
/  Client-side code
/
*/

let counter = 0
const mainCanvas = document.getElementById('curlingFullCanvas')
const zoomedCanvas = document.getElementById('curlingCloseUp')

const mainCanvasHeight = mainCanvas.height
const mainCanvasWidth = mainCanvas.width

let rocks = []  // Add initial rocks
rocks.push({ id: 0, colour:'red', x: 25, y: 500, v_x: 0, v_y: 0})
rocks.push({ id: 1, colour: 'yellow', x: 40, y: 150, v_x: 0, v_y: 0})
rocks.push({ id: 2, colour: 'red', x:70, y:50, v_x: 0, v_y: 0})
rocks.push({ id: 3, colour: 'yellow', x:70, y:100, v_x: 0, v_y: 0})
rocks.push({ id: 4, colour: 'red', x:70, y:150, v_x: 0, v_y: 0})
rocks.push({ id: 5, colour: 'yellow', x:59, y:300, v_x: 0, v_y: 0})
const ROCK_RADIUS = 12
const ZOOM_ROCK_RADIUS = 4*ROCK_RADIUS
const FRICTION_CONSTANT = 0.002

let socket = io("http://" + window.document.location.host)

let rockPlayed
let deltaX, deltaY
let canvasX, canvasY

socket.on("playGame", function(data) {
	let retData = JSON.parse(data)
	if (retData.isPlayer) {
		connectMouseListener(true)
		document.getElementById('joinButton').disabled = true
		
	}
	else {
		connectMouseListener(false)
	}
})

function watchGame() {
	socket.emit("watchGame")
	connectMouseListener(false)
	document.getElementById('joinButton').disabled = false
	
}

function joinGame() {
	socket.emit("playGame")
}

socket.on('rockData', function(data) {
	//console.log("data: " + data)
	//console.log("typeof: " + typeof data)
	
	let rockInfo = JSON.parse(data)
	//console.log("rock info", rockInfo)
	//console.log("rock array BEFORE", rocks)
	let rock = rocks[rockInfo.id]
	rock.x = rockInfo.x
	rock.y = rockInfo.y
	rock.v_x = rockInfo.v_x
	rock.v_y = rockInfo.v_y
	//console.log("rock array AFTER", rocks)
	//rocks[rockInfo.id] = rock
	//drawCanvas()
})

function collisionBetween(rock1, rock2) {
	if(Math.pow((Math.pow(rock1.x-rock2.x,2)+Math.pow(rock1.y-rock2.y, 2)), 0.5) <= 2*ROCK_RADIUS) {
		
		console.log(Math.pow((Math.pow(rock1.x-rock2.x,2)+Math.pow(rock1.y-rock2.y, 2)), 0.5))
		
		return true
	}
	else { return false}
}

function resolveCollision(rock1, rock2) {
	
	console.log("Rock 1 before collision: ", rock1)
	let d = Math.pow((Math.pow(rock1.x-rock2.x,2)+Math.pow(rock1.y-rock2.y, 2)), 0.5)
	let theta = Math.atan((rock2.y-rock1.y)/(rock2.x-rock1.x))
	
	if (rock2.y > rock1.y) {rock2.y += (2*ROCK_RADIUS-d)*Math.cos(theta)}
	else {rock1.y += (2*ROCK_RADIUS-d)*Math.cos(theta)}
	
	if(rock2.x > rock1.x) {rock2.x += (2*ROCK_RADIUS-d)*Math.sin(theta)}
	else {rock1.x += (2*ROCK_RADIUS-d)*Math.sin(theta)}
	
	let deltaV_1 = getDeltaVel(rock1, theta)
	let deltaV_2 = getDeltaVel(rock2, theta)
	
	if (deltaV_1.v_x > 10 || deltaV_1.v_y > 10 || deltaV_2.v_x > 10 || deltaV_2.v_y > 10) {
		console.log(counter)
		console.log(deltaV_1)
		console.log(deltaV_2)
	}
	
	//console.log("Rock 1 before collision: ", rock1)
	//console.log("Rock 2 before collision: ", rock2)

	rock1.v_x -= deltaV_1.v_x
	rock1.v_y -= deltaV_1.v_y
	rock2.v_x += deltaV_1.v_x
	rock2.v_y += deltaV_1.v_y
	
	
	rock2.v_x -= deltaV_2.v_x
	rock2.v_y -= deltaV_2.v_y
	rock1.v_x += deltaV_2.v_x
	rock1.v_y += deltaV_2.v_y
	
	//console.log("Rock 1 after collision: ", rock1)
	//console.log("Rock 2 after collision: ", rock2)

	return
}

function getDeltaVel(rock, theta) {
	let phi  
	if (rock.v_x !== 0) {
		phi = Math.atan((Math.abs(rock.v_y)/Math.abs(rock.v_x)))
	}
	else {phi = 90}
	let alpha = phi-theta
	let v = Math.abs(rock.v_y)/Math.sin(phi)
	let u = v*Math.cos(alpha)
	let u_x = u*Math.cos(alpha)
	let u_y = u*Math.sin(alpha)
	
	if(rock.v_x >= 0) 	{u_x = Math.abs(u_x)}
	else				{u_x = -Math.abs(u_x)}

	if(rock.v_y >= 0)	{u_y = Math.abs(u_y)}
	else				{u_y = -Math.abs(u_y)}
		
	let deltaV = {v_x:u_x, v_y:u_y}
	return deltaV
}

function checkForCollisions() {
	
	rocks_copy = rocks.slice()
	rocks_copy.sort(function(a,b) {
		return a.y - b.y
	})
	
	for (let i=0; i<rocks_copy.length-1; i++) {
		if (rocks_copy[i+1].y - rocks_copy[i].y <= 2*ROCK_RADIUS) {
			if (collisionBetween(rocks_copy[i], rocks_copy[i+1])) {
				resolveCollision(rocks_copy[i], rocks_copy[i+1])
			}
		}
	}
	for (let i=0; i<rocks_copy.length; i++) {
		if (rocks[i].x + ROCK_RADIUS > mainCanvasWidth || rocks[i].x - ROCK_RADIUS < 0) {
			rocks[i].v_x = -rocks[i].v_x
		}
		if (rocks[i].y + ROCK_RADIUS > mainCanvasHeight || rocks[i].y - ROCK_RADIUS < 0) {
			rocks[i].v_y = -rocks[i].v_y
		}
	}
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
		
		// Adjust speed based on velocitu
		rock.x += rock.v_x
		rock.y += rock.v_y
		
		// Apply friction
		if (rock.v_x != 0) {
			let theta = Math.atan(rock.v_y / rock.v_x)
			let v = Math.sqrt(Math.pow(rock.v_x, 2) + Math.pow(rock.v_y, 2))
			//console.log('v: ' + v + ', theta: '+ theta + ', v_y: ' + rock.v_y + ", v_x: " + rock.v_x)
			//console.log("v", v)
			v -= FRICTION_CONSTANT
			// Reset velocities based on constants
			if (v <= 0.001) v = 0
			
			if (rock.v_x >= 0 && rock.v_y >= 0) {
				//console.log('case 1')
				rock.v_x = v*Math.cos(theta)
				rock.v_y = v*Math.sin(theta)
			}
			else if (rock.v_x <= 0 && rock.v_y >= 0) {
				//console.log('case 2')
				rock.v_x = -1*v*Math.cos(theta)
				rock.v_y = -1*v*Math.sin(theta)
			}
			else if (rock.v_x >= 0 && rock.v_y <= 0) {
				//console.log('case 3')
				rock.v_x = v*Math.cos(theta)
				rock.v_y = v*Math.sin(theta)
			}
			else {
				//console.log('case 4')
				rock.v_x = -1*v*Math.cos(theta)
				rock.v_y = -1*v*Math.sin(theta)
			}
		}
		
		context.beginPath()
		context.arc(rock.x, rock.y, ROCK_RADIUS, 0, 2*Math.PI, true)
		context.lineWidth = 5
		context.fillStyle = rock.colour
		context.fill()
		context.strokeStyle = 'grey'
		context.stroke()
		
		if (rock.y <= 150 + ROCK_RADIUS + 5) {
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
	

	
	if (rockPlayed != null) {
		context.beginPath()
		context.moveTo(rockPlayed.x, rockPlayed.y)
		context.lineTo(canvasX, canvasY)
		context.strokeStyle = 'black'
		context.stroke()
	}
	
	
	
}


function handleTimer() {
  counter++
  checkForCollisions()	
  drawCanvas()
}

function handleMouseDown(e) {
  rockPlayed = null
  //get mouse location relative to canvas top left
  let rect = mainCanvas.getBoundingClientRect()
  //var canvasX = e.clientX - rect.left
  //var canvasY = e.clientY - rect.top
  canvasX = e.clientX - rect.left //use jQuery event object clientX and clientY
  canvasY = e.clientY - rect.top
  //console.log("mouse down:" + canvasX + ", " + canvasY)

  // Find if player clicked on a rock
  for (let i = 0; i < rocks.length; i++) {

	  let rock = rocks[i]
	  if (Math.abs(canvasX - rock.x) <= ROCK_RADIUS && Math.abs(canvasY - rock.y) <= ROCK_RADIUS) {
		  //console.log("ROCK FOUND", rock)
		  rockPlayed = rock
		  break
	  }
  }
  
  if (rockPlayed != null) {
	  
	deltaX = rockPlayed.x - canvasX
    deltaY = rockPlayed.y - canvasY
	if (rockPlayed.v_x == 0 && rockPlayed.v_y == 0) {
		$("#curlingFullCanvas").mousemove(handleMouseMove)
		$("#curlingFullCanvas").mouseup(handleMouseUp)
	}
	else {
		rockPlayed.v_x = 0
		rockPlayed.v_y = 0
		rockPlayed = null
		return
	}
	
	  
  }
  else return
  
  let dataObj = { id: rockPlayed.id, x: rockPlayed.x, y: rockPlayed.y, v_x: 0, v_y: 0 }
  let jsonString = JSON.stringify(dataObj)
  socket.emit("rockData",jsonString)
  e.stopPropagation()
  e.preventDefault()
  
  //drawCanvas()
}

function handleMouseMove(e) {

  console.log("mouse move")

  //get mouse location relative to canvas top left
  let rect = mainCanvas.getBoundingClientRect()
  canvasX = e.clientX - rect.left
  canvasY = e.clientY - rect.top

  //rockPlayed.x = canvasX + deltaX
  //rockPlayed.y = canvasY + deltaY

  e.stopPropagation()
  let dataObj = { id: rockPlayed.id, x: rockPlayed.x, y: rockPlayed.y, v_x: 0, v_y: 0 }
  let jsonString = JSON.stringify(dataObj)
  socket.emit("rockData", jsonString)

  //drawCanvas()
}

function handleMouseUp(e) {
  console.log("mouse up")
  

  e.stopPropagation()

  //$("#curlingFullCanvas").off(); //remove all event handlers from canvas
  //$("#curlingFullCanvas").mousedown(handleMouseDown); //add mouse down handler

  //remove mouse move and mouse up handlers but leave mouse down handler
  $("#curlingFullCanvas").off("mousemove", handleMouseMove) //remove mouse move handler
  $("#curlingFullCanvas").off("mouseup", handleMouseUp) //remove mouse up handler
  
  // Calculate the Euclidean distance between the rock and the cursor
  let x_comp = (rockPlayed.x - canvasX)
  let y_comp = (rockPlayed.y - canvasY)
  
  rockPlayed.v_x = x_comp/50
  rockPlayed.v_y = y_comp/50
  
  let dataObj = { id: rockPlayed.id, x: rockPlayed.x, y: rockPlayed.y, v_x: rockPlayed.v_x, v_y: rockPlayed.v_y }
  let jsonString = JSON.stringify(dataObj)
  socket.emit("rockData", jsonString)
  
  rockPlayed = null
}

$(document).ready(function() {
  //This is called after the broswer has loaded the web page

  timer = setInterval(handleTimer, 10)
  //clearTimeout(timer) //to stop
  


  drawCanvas()
  
})

