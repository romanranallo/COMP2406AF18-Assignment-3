/*
/  Client-side code
/
*/

const mainCanvas = document.getElementById('curlingFullCanvas')
const zoomCanvas = document.getElementById('curlingCloseUp')


function drawCanvas() {
  
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

  drawCanvas()
})

