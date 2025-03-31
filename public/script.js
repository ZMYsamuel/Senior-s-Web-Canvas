// Get references to canvas and its context
const canvas = document.getElementById("paintCanvas");
const context = canvas.getContext("2d");

// Get references to sliders and color controls
const redSlider = document.getElementById("redSlider");
const greenSlider = document.getElementById("greenSlider");
const blueSlider = document.getElementById("blueSlider");
const currentColorDiv = document.getElementById("currentColor");
const brushSize = document.getElementById("brushSize");

// Get references to font controls
const fontFamilySelect = document.getElementById("fontFamilySelect");
const fontSizeSelect = document.getElementById("fontSizeSelect");

// Get references to tool buttons
const brushButton = document.getElementById("brushBtn");
const eraserButton = document.getElementById("eraserBtn");
const textButton = document.getElementById("textBtn");
const lineButton = document.getElementById("lineBtn");
const circleButton = document.getElementById("circleBtn");
const rectangleButton = document.getElementById("rectangleBtn");
const triangleButton = document.getElementById("triangleBtn");
const fillCheckbox = document.getElementById("fillCheckbox");
const clearButton = document.getElementById("clearBtn");
const undoButton = document.getElementById("undoBtn");
const redoButton = document.getElementById("redoBtn");
const uploadButton = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const downloadButton = document.getElementById("downloadBtn");

// Initialize variables
let painting = false; // Whether the user is currently drawing
let undoStack = []; // Stack to store canvas states for undo/redo
let undoPointer = -1; // Pointer to the current state in the undo stack
let cursorTool = "Brush"; // Current tool selected
let selectedFontFamily = "Arial"; // Default font family
let selectedFontSize = "12px"; // Default font size
let isShapeFilled = false; // Whether shapes should be filled

// Function to update the time widget
function updateTime() {
  const now = new Date();
  const hours = now.getUTCHours() + 8; // Convert to UTC+8
  const minutes = now.getUTCMinutes();
  const seconds = now.getUTCSeconds();
  document.getElementById('timeText').textContent = `${(hours % 24).toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Update the time every second
setInterval(updateTime, 1000);

// Initialize the canvas and controls
window.addEventListener("load", () => {
  saveState(); // Save the initial state of the canvas
  updateColor(); // Set the initial color
  updateTime(); // Display the current time
  canvas.style.cursor = "url('./src/brush_icon.gif'), auto"; // Set the default cursor
});

// Event listeners for color sliders
redSlider.addEventListener("input", updateColor);
greenSlider.addEventListener("input", updateColor);
blueSlider.addEventListener("input", updateColor);

// Function to update the current color
function updateColor() {
  const redValue = redSlider.value;
  const greenValue = greenSlider.value;
  const blueValue = blueSlider.value;
  const newColor = `rgb(${redValue}, ${greenValue}, ${blueValue})`;

  context.strokeStyle = newColor; // Set stroke color
  context.fillStyle = newColor; // Set fill color
  currentColorDiv.style.backgroundColor = newColor; // Update the color display
}

// Function to handle text input on the canvas
function startDraw(e) {
  if (cursorTool === "Text") {
    let mouseX = e.clientX - canvas.getBoundingClientRect().left;
    let mouseY = e.clientY - canvas.getBoundingClientRect().top;

    const x = e.clientX;
    const y = e.clientY;
    const textInput = document.createElement("input");

    textInput.type = "text";
    textInput.placeholder = "Type text here...";
    textInput.style.position = "fixed";
    textInput.style.left = x + "px";
    textInput.style.top = y + "px";

    const handleTextInput = () => {
      document.body.removeChild(textInput);
      if (textInput.value.trim() === "") return;
      context.font = `${selectedFontSize} ${selectedFontFamily}`;
      context.fillText(textInput.value, mouseX, mouseY);
      saveState();
    };

    textInput.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleTextInput();
      }
    });

    document.body.appendChild(textInput);
    textInput.focus();
    return;
  }

  painting = true; // Start drawing
  lastX = e.clientX - canvas.getBoundingClientRect().left;
  lastY = e.clientY - canvas.getBoundingClientRect().top;

  context.lineWidth = brushSize.value; // Set brush size
  context.lineCap = "round"; // Set line cap style
  context.beginPath(); // Begin a new path
}

// Function to draw on the canvas
function draw(e) {
  if (!painting) return;

  let mouseX = e.clientX - canvas.getBoundingClientRect().left;
  let mouseY = e.clientY - canvas.getBoundingClientRect().top;

  if (cursorTool === "Eraser") context.globalCompositeOperation = "destination-out";
  else context.globalCompositeOperation = "source-over";

  if (cursorTool === "Eraser" || cursorTool === "Brush") {
    context.lineTo(mouseX, mouseY);
    context.stroke();
  } else if (cursorTool === "Line") {
    context.putImageData(undoStack[undoPointer], 0, 0);
    context.beginPath();
    context.moveTo(lastX, lastY);
    context.lineTo(mouseX, mouseY);
    context.stroke();
  } else if (cursorTool === "Circle") {
    context.putImageData(undoStack[undoPointer], 0, 0);
    let radius = Math.sqrt((lastX - mouseX) * (lastX - mouseX) + (lastY - mouseY) * (lastY - mouseY));
    context.beginPath();
    context.arc(lastX, lastY, radius, 0, 2 * Math.PI);
    isShapeFilled ? context.fill() : context.stroke();
  } else if (cursorTool === "Rectangle") {
    context.putImageData(undoStack[undoPointer], 0, 0);
    context.beginPath();
    isShapeFilled ? context.fillRect(lastX, lastY, mouseX - lastX, mouseY - lastY) : context.strokeRect(lastX, lastY, mouseX - lastX, mouseY - lastY);
  } else if (cursorTool === "Triangle") {
    context.putImageData(undoStack[undoPointer], 0, 0);
    context.beginPath();
    context.moveTo(lastX, lastY);
    context.lineTo(lastX + (mouseX - lastX), mouseY);
    context.lineTo(lastX + (lastX - mouseX), mouseY);
    context.closePath();
    isShapeFilled ? context.fill() : context.stroke();
  } else {
    console.log("cursorTool error:" + cursorTool);
  }
}

// Function to save the current state of the canvas
function saveState() {
  let currentState = context.getImageData(0, 0, canvas.width, canvas.height);
  undoStack.splice(undoPointer + 1); // Remove states after the current pointer
  undoStack.push(currentState); // Add the current state to the stack
  undoPointer++; // Move the pointer to the new state
}

// Event listener for the clear button
clearButton.addEventListener("click", () => {
  context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
  saveState(); // Save the cleared state
});

// Event listeners for tool buttons
brushButton.addEventListener("click", () => {
  cursorTool = "Brush"; // Set the tool to brush
  canvas.style.cursor = "url('./src/brush_icon.gif'), auto"; // Update the cursor
  document.querySelector(".container .controls .active").classList.remove("active");
  brushButton.classList.add("active");
});

eraserButton.addEventListener("click", () => {
  cursorTool = "Eraser"; // Set the tool to eraser
  canvas.style.cursor = "url('./src/eraser_icon.png'), auto"; // Update the cursor
  document.querySelector(".container .controls .active").classList.remove("active");
  eraserButton.classList.add("active");
});

lineButton.addEventListener("click", () => {
  cursorTool = "Line"; // Set the tool to line
  canvas.style.cursor = "url('./src/line_icon.png'), auto"; // Update the cursor
  document.querySelector(".container .controls .active").classList.remove("active");
  lineButton.classList.add("active");
});

circleButton.addEventListener("click", () => {
  cursorTool = "Circle"; // Set the tool to circle
  canvas.style.cursor = "url('./src/circle_icon.png'), auto"; // Update the cursor
  document.querySelector(".container .controls .active").classList.remove("active");
  circleButton.classList.add("active");
});

rectangleButton.addEventListener("click", () => {
  cursorTool = "Rectangle"; // Set the tool to rectangle
  canvas.style.cursor = "url('./src/rectangle_icon.png'), auto"; // Update the cursor
  document.querySelector(".container .controls .active").classList.remove("active");
  rectangleButton.classList.add("active");
});

triangleButton.addEventListener("click", () => {
  cursorTool = "Triangle"; // Set the tool to triangle
  canvas.style.cursor = "url('./src/triangle_icon.png'), auto"; // Update the cursor
  document.querySelector(".container .controls .active").classList.remove("active");
  triangleButton.classList.add("active");
});

// Event listeners for undo and redo buttons
undoButton.addEventListener("click", () => {
  if (undoPointer > 0) {
    undoPointer--; // Move the pointer back
    context.putImageData(undoStack[undoPointer], 0, 0); // Restore the previous state
  }
});

redoButton.addEventListener("click", () => {
  if (undoPointer < undoStack.length - 1) {
    undoPointer++; // Move the pointer forward
    context.putImageData(undoStack[undoPointer], 0, 0); // Restore the next state
  }
});

// Event listener for the upload button
uploadButton.addEventListener("click", async () => {
  await new Promise(resolve => {
    fileInput.addEventListener("change", resolve, { once: true });
    fileInput.click(); // Simulate a click on the file input
  });

  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = () => {
        context.drawImage(img, 0, 0, canvas.width, canvas.height); // Draw the uploaded image
        saveState(); // Save the new state
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file); // Read the file as a data URL
  }
});

// Event listener for the download button
downloadButton.addEventListener("click", () => {
  const link = document.createElement("a");
  link.href = canvas.toDataURL(); // Get the canvas data URL
  link.download = "canvas_image.png"; // Set the filename for the downloaded image
  link.click(); // Simulate a click on the link to start the download
});

// Event listener for the text button
textButton.addEventListener("click", () => {
  cursorTool = "Text"; // Set the tool to text
  canvas.style.cursor = "url('./src/text_icon.png'), auto"; // Update the cursor
  document.querySelector(".container .controls .active").classList.remove("active");
  textButton.classList.add("active");
});

// Event listeners for font controls
fontFamilySelect.addEventListener("change", () => {
  selectedFontFamily = fontFamilySelect.value; // Update the selected font family
});

fontSizeSelect.addEventListener("change", () => {
  selectedFontSize = fontSizeSelect.value + "px"; // Update the selected font size
});

// Event listener for the fill checkbox
fillCheckbox.addEventListener("change", () => {
  isShapeFilled = fillCheckbox.checked; // Update the fill state
});

// Event listeners for canvas actions
canvas.addEventListener("mousedown", startDraw); // Start drawing
canvas.addEventListener("mousemove", draw); // Draw on the canvas
canvas.addEventListener("mouseup", () => {
  if (cursorTool !== "Text") {
    painting = false; // Stop drawing
    saveState(); // Save the current state
  }
});
canvas.addEventListener("mouseout", () => {
  if (!painting) return;
  if (cursorTool !== "Text") {
    painting = false; // Stop drawing
    saveState(); // Save the current state
  }
});