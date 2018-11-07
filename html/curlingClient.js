/*
/  Client-side code
/
*/

const mainCanvas = document.getElementById('curlingFullCanvas')
const zoomedCanvas = document.getElementById('curlingCloseUp')

let isPlayer = false
let socket = io("http://" + window.document.location.host)

socket.on("playGame", function(data) {
	let retData = JSON.parse(data)
	isPlayer = retData.isPlayer
	console.log(isPlayer)
})


function drawCanvas() {
	// Display the button in the main canvas 
	let context = zoomedCanvas.getContext('2d')
	
	let zoom_x = 400
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
	
}


function handleTimer() {

  drawCanvas()
}

function handleMouseDown() {
  
  drawCanvas()
}

$(document).ready(function() {
  //This is called after the broswer has loaded the web page

  //add mouse down listener to our canvas object
  $("#curlingFullCanvas").mousedown(handleMouseDown)
  
  timer = setInterval(handleTimer, 100)
  //clearTimeout(timer) //to stop

  socket.emit("playGame")
  drawCanvas()
  
})

