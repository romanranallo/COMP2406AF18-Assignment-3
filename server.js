/*
COMP 2406 Assignment 3

Roman Ranallo
Richard St. John
*/


//Server Code -- first bit same as T02
const app = require("http").createServer(handler) //need to http
const io = require("socket.io")(app)
const fs = require("fs"); //need to read static files
const url = require("url"); //to parse url strings
const PORT = process.env.PORT || 3000

const ROOT_DIR = "html"; //dir to serve static files from
const MAX_PLAYERS = 2

let redPlayer = null
let yellowPlayer = null

const MIME_TYPES = {
  css: "text/css",
  gif: "image/gif",
  htm: "text/html",
  html: "text/html",
  ico: "image/x-icon",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  js: "application/javascript",
  json: "application/json",
  png: "image/png",
  svg: "image/svg+xml",
  txt: "text/plain"
}

const get_mime = function(filename) {
  //Use file extension to determine the correct response MIME type
  for (let ext in MIME_TYPES) {
    if (filename.indexOf(ext, filename.length - ext.length) !== -1) {
       return MIME_TYPES[ext]
    }
  }
  return MIME_TYPES["txt"]
}

let rocks = []
rocks.push({id: 0, x: 20, y: 500, v_x: 0, v_y: 0})
rocks.push({id: 1, x: 50, y: 500, v_x: 0, v_y: 0})
rocks.push({id: 2, x: 80, y: 500, v_x: 0, v_y: 0})
rocks.push({id: 3, x: 110, y: 510, v_x: 0, v_y: 0})
rocks.push({id: 4, x: 20, y: 100, v_x: 0, v_y: 0})
rocks.push({id: 5, x: 70, y: 300, v_x: 0, v_y: 0})
let spectators = []
let players = []
let playersFull = false

function addPlayer(player) {
	if (players.length === 0) {
		host = player
	}
	if (players.length < MAX_PLAYERS) {
		if (redPlayer == null) redPlayer = player
		else yellowPlayer = player
		players.push(player) 
	}
	if (players.length >= MAX_PLAYERS) 	{playersFull = true }
}

function removePlayer(player) {
	players.pop(player)
	playersFull = false	
	if (player === host) {
		if (players.length === 0) {
			if(spectators.length === 0) {
				host = null
			}
			else {host = spectators[0]}
		}
		else {host = players[0]}
	}
}

function addSpectator(spec) {
	if(players.length === 0 && spectators.length === 0) {host = spec}
	spectators.push(spec)
}

function removeSpectator(spec) {
	spectators.pop(spec)
	if(spec === host) {
		host = null
	}
}

function reqData(data) {
	console.log("host is null:", (host==null))
	if(host != null) {
		console.log("ask host for data")
		host.emit('requestData')
	}
}

app.listen(PORT)
// Modified from T02 to handle assignment specs
function handler(request, response) {
    let urlObj = url.parse(request.url, true, false)
    console.log("\n============================")
    console.log("PATHNAME: " + urlObj.pathname)
    console.log("REQUEST: " + ROOT_DIR + urlObj.pathname)
    console.log("METHOD: " + request.method)

    let receivedData = ""
	let responseObject = {}

    //Event handlers to collect the message data
    request.on("data", function(chunk) {
      receivedData += chunk;
    })

    //Event handler for the end of the message
    request.on("end", function() {
		if (request.method == "GET") {
        //Handle GET requests
        //Treat GET requests as request for static file
        let filePath = ROOT_DIR + urlObj.pathname
        if (urlObj.pathname === "/") filePath = ROOT_DIR + "/index.html"

        fs.readFile(filePath, function(err	, data) {
          if (err) {
            //report error to console
            console.log("ERROR: " + JSON.stringify(err))
            //respond with not found 404 to client
            response.writeHead(404)
            response.end(JSON.stringify(err))
            return
          }
          //respond with file contents
          response.writeHead(200, { "Content-Type": get_mime(filePath) })
          response.end(data)
        })
      }
	})
  }
  
io.on("connection", function(socket) {
	addSpectator(socket)
	
	socket.on("playGame", function(data) {
		console.log("Received Player request: " + data)
		responseObj = {isPlayer:false, colour: "none"}
		if(!playersFull && !players.includes(socket)) {
			removeSpectator(socket)
			addPlayer(socket)
			responseObj.isPlayer = true;
			if (socket == redPlayer) responseObj.colour = "red"
			else if (socket == yellowPlayer) responseObj.colour = "yellow"
			console.log("Player added")
		}
		socket.emit("playGame", JSON.stringify(responseObj))
	})
	
	socket.on("watchGame", function() {
		if(players.includes(socket)) {
			removePlayer(socket)
			addSpectator(socket)
			console.log("player now spectating")
		}
	})
	
	socket.on("disconnect", function() {
		if(players.includes(socket)) {
			removePlayer(socket)
			removeSpectator(socket)
			console.log("Player left")
		}
	})
	
    socket.on('rockData', function(data){
		console.log('RECEIVED ROCK DATA: ' + data)
		rocks[data.id] = data
		//to broadcast message to everyone including sender:
		io.emit('rockData', data) //broadcast to everyone including sender
	})
	
	/*socket.on('requestData', function(data) {
		console.log("host is null:", (host==null))
		if(host != null) {
			console.log("ask host for data")
			host.emit('requestData')
		}
	})*/
	
	io.emit("rocksData", JSON.stringify(rocks))
	
	//socket.on('updateFromHost', function(data) {
		//io.emit('rockData', data)
	//})
	
	//timer = setInterval(reqData, 1000)
})
  
  

console.log("\nServer Running at PORT 3000  CNTL-C to quit")
console.log("To Test:")
console.log("http://localhost:3000/assignment3.html")
