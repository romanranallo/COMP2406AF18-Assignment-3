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
rocks.push({ id: 0, colour:'red', x: -55, y: -50, v_x: 0, v_y: 0})
rocks.push({ id: 1, colour: 'yellow', x: -50, y: -50, v_x: 0, v_y: 0})
rocks.push({ id: 2, colour: 'red', x:-50, y: -50, v_x: 0, v_y: 0})
rocks.push({ id: 3, colour: 'yellow', x:-50, y: -50, v_x: 0, v_y: 0})
rocks.push({ id: 4, colour: 'red', x:-50, y:-50, v_x: 0, v_y: 0})
rocks.push({ id: 5, colour: 'yellow', x:-50, y:-50, v_x: 0, v_y: 0})
const ROCK_RADIUS = 12
const ZOOM_ROCK_RADIUS = 4*ROCK_RADIUS
const FRICTION_CONSTANT = 0.002

let socket = io("http://" + window.document.location.host)

let rockPlayed
let deltaX, deltaY
let canvasX, canvasY

let isControllingRed = false
let isControllingYellow = false

let name = ''

//socket.emit('requestData')

socket.on("playGame", function(data) {
	let retData = JSON.parse(data)
	if (retData.isPlayer) {
		if (retData.colour == "red") {
			isControllingRed = true
			document.getElementById("text-area").innerText = "Hi " + name + ". You have control of RED"
		}
		else {
			isControllingYellow = true
			document.getElementById("text-area").innerText = "Hi " + name + ". You have control of YELLOW"
		}
		connectMouseListener(true)
		document.getElementById('joinButton').disabled = true
		
	}
	else {
		document.getElementById("text-area").innerHTML = "Hi " + name + ". Both rocks are being used. Keep trying if you'd wish to play."
		connectMouseListener(false)
	}
})

/*
socket.on('requestData', function() {
	console.log("In request data")
	for (let i=0; i<rocks.length; i++) {
		console.log("sending data to server")
		socket.emit('rockData', JSON.stringify(rocks[i]))
	}
})
*/

//handle watch game button
function watchGame() {
	socket.emit("watchGame")
	isControllingRed = false
	isControllingYellow = false
	document.getElementById('text-area').innerHTML = "You have relinqueshed control of the rock. Click 'join' to re-join'"
	connectMouseListener(false)
	document.getElementById('joinButton').disabled = false
}

function resetRocks() {
	socket.emit('reset')
}

//handle join game button
function joinGame() {
	if ($('#userTextField').val() == '' && name == '') {
		window.alert("Please enter your name")
		return 
	}
	if (name == '') name = $('#userTextField').val()
	$('#userTextField').val('')
	
	socket.emit("playGame")
}

//set data of single rock based on data from server
socket.on('rockData', function(data) {
	console.log("data: " + data)
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

//set data of all rocks based on data from server
socket.on('rocksData', function(data) {
	rockArr = JSON.parse(data)
	console.log("rocksData", data)
	for (let i = 0; i < rockArr.length; i++) {
		let rock = rocks[i]
		let rock_from_data = rockArr[i]
		rock.x = rock_from_data.x
		rock.y = rock_from_data.y
		rock.v_x = rock_from_data.v_x
		rock.v_y = rock_from_data.v_y
	}
	
})

//check if two rocks have collided
function collisionBetween(rock1, rock2) {
	if(Math.pow((Math.pow(rock1.x-rock2.x,2)+Math.pow(rock1.y-rock2.y, 2)), 0.5) <= 2*ROCK_RADIUS) {
		//console.log(Math.pow((Math.pow(rock1.x-rock2.x,2)+Math.pow(rock1.y-rock2.y, 2)), 0.5))
		return true
	}
	else { return false}
}

function resolveCollision(rock1, rock2) {
	
	//console.log("Rock 1 before collision: ", rock1)
	let d = Math.pow((Math.pow(rock1.x-rock2.x,2)+Math.pow(rock1.y-rock2.y, 2)), 0.5)
	let theta = Math.atan((rock2.y-rock1.y)/(rock2.x-rock1.x))
	
	//move the rocks so they are no longer overlapping
	if (rock2.y > rock1.y) {rock2.y += (2*ROCK_RADIUS-d)*Math.cos(theta)+3}
	else {rock1.y += (2*ROCK_RADIUS-d)*Math.cos(theta) +3}
	
	//move rocks so they are no longer overlapping
	if(rock2.x > rock1.x) {rock2.x += (2*ROCK_RADIUS-d)*Math.sin(theta)+3}
	else {rock1.x += (2*ROCK_RADIUS-d)*Math.sin(theta)+3}
	
	//compute velocites along angle of collision for each rock
	let deltaV_1 = getDeltaVel(rock1, theta)
	let deltaV_2 = getDeltaVel(rock2, theta)
	
	//debug
	/*
	if (deltaV_1.v_x > 10 || deltaV_1.v_y > 10 || deltaV_2.v_x > 10 || deltaV_2.v_y > 10) {
		console.log(counter)
		console.log(deltaV_1)
		console.log(deltaV_2)
	}
	*/
	
	//console.log("Rock 1 before collision: ", rock1)
	//console.log("Rock 2 before collision: ", rock2)
	
	//change velocities
	rock1.v_x -= deltaV_1.v_x
	rock1.v_y -= deltaV_1.v_y
	rock2.v_x += deltaV_1.v_x
	rock2.v_y += deltaV_1.v_y
	
	rock2.v_x -= deltaV_2.v_x
	rock2.v_y -= deltaV_2.v_y
	rock1.v_x += deltaV_2.v_x
	rock1.v_y += deltaV_2.v_y
	
	//reduce by scalar for each collision
	rock1.v_x *= 0.8
	rock1.v_y *= 0.8
	rock2.v_x *= 0.8
	rock2.v_y *= 0.8
	
	//console.log("Rock 1 after collision: ", rock1)
	//console.log("Rock 2 after collision: ", rock2)

	return
}

function getDeltaVel(rock, theta) {
	let phi  
	//dont divide by zero!
	if (rock.v_x !== 0) {
		phi = Math.atan((Math.abs(rock.v_y)/Math.abs(rock.v_x)))
	}
	else {phi = 90}
	let alpha
	
	//change angle depending on which quadrant the velocity vector is in
	if(rock.v_x >= 0 && rock.v_y >= 0) {alpha = phi-theta}
	else if (rock.v_x >= 0 && rock.v_y <= 0) {alpha = phi+theta}
	else if (rock.v_x <= 0 && rock.v_y >= 0) {alpha = phi+theta}
	else {alpha = phi-theta}
	
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
	
	// use this if collision detection changed to prune the number of combinations	
/*	
	rocks_copy.sort(function(a,b) {
		return a.y - b.y
	})
*/	
	//check each pair of rocks for collision
	for (let i=0; i<rocks_copy.length; i++) {
		for (let j=0; j<rocks_copy.length; j++){
			if (i == j) {continue}
			if (rocks_copy[i].y - rocks_copy[j].y <= 2*ROCK_RADIUS) {
				if (collisionBetween(rocks_copy[i], rocks_copy[j])) {
					resolveCollision(rocks_copy[i], rocks_copy[j])
				}
			}
		}
	}
	//make rocks bounce off walls, reduce speed a little 
	for (let i=0; i<rocks_copy.length; i++) {
		//hit right wall
		if (rocks[i].x + ROCK_RADIUS > mainCanvasWidth)  {
			rocks[i].v_x = -Math.abs(rocks[i].v_x)
			rocks[i].v_x *= 0.8
			rocks[i].x = mainCanvasWidth-ROCK_RADIUS
		}
		//hit left wall
		else if(rocks[i].x - ROCK_RADIUS < 0) {
			rocks[i].v_x = Math.abs(rocks[i].v_x)
			rocks[i].v_x *= 0.8
			rocks[i].x = ROCK_RADIUS
		}
		//hit bottom wall
		if (rocks[i].y + ROCK_RADIUS > mainCanvasHeight)  {
			rocks[i].v_y = -Math.abs(rocks[i].v_y)
			rocks[i].v_y *= 0.8
			rocks[i].y = mainCanvasHeight-ROCK_RADIUS
		}
		//hit top wall
		else if (rocks[i].y - ROCK_RADIUS < 0) {
			rocks[i].v_y = Math.abs(rocks[i].v_y)
			rocks[i].v_y *= 0.8
			rocks[i].y = ROCK_RADIUS
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
	//console.log(rocks)
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
  counter %= 100
  if (counter === 0) {
	  for (let i=0; i<rocks.length; i++) {
		  socket.emit('rockData', rocks[i])
	  }
  }
  
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
		  if (rock.colour == "red") {
			  if (isControllingRed) rockPlayed = rock
		  }
		  else {
			  if (isControllingYellow) rockPlayed = rock
		  }
		  //rockPlayed = rock
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

//KEY CODES
const ENTER = 13

// Took out all the arrow key code from T02
function handleKeyDown(e) {

  console.log("keydown code = " + e.which)
}

// Removed all arrow key handling
function handleKeyUp(e) {
  console.log("key UP: " + e.which)

  if (isControllingRed || isControllingYellow) return
  if (e.which == ENTER) {
    joinGame() //treat ENTER key like you would a submit
    $('#userTextField').val('') //clear the user text field
  }

  e.stopPropagation()
  e.preventDefault()
}

$(document).ready(function() {
  //This is called after the broswer has loaded the web page

  timer = setInterval(handleTimer, 10)
  //clearTimeout(timer) //to stop
  //add key handler for the document as a whole, not separate words[i]ments.
  $(document).keydown(handleKeyDown)
  $(document).keyup(handleKeyUp)
 
  document.getElementById("text-area").innerHTML = "Welcome. Click 'Join Game' to take control of a rock. Click 'Watch Game' to give up the rock."



  drawCanvas()
  
})

