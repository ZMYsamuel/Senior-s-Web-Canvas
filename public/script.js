// Get canvas and its context
const canvas = document.getElementById("paintCanvas");
const context = canvas.getContext("2d");

// Get sliders for RGB color selection
const redSlider = document.getElementById("redSlider");
const greenSlider = document.getElementById("greenSlider");
const blueSlider = document.getElementById("blueSlider");
const currentColorDiv = document.getElementById("currentColor"); // Div to display the current color
const brushSize = document.getElementById("brushSize"); // Slider for brush size

// Initialize RGB values
const redValue = redSlider.value;
const greenValue = greenSlider.value;
const blueValue = blueSlider.value;

// Font settings
const fontFamilySelect = document.getElementById("fontFamilySelect"); // Dropdown for font family
const fontSizeSelect = document.getElementById("fontSizeSelect"); // Dropdown for font size

// Tool buttons
const brushButton = document.getElementById("brushBtn");
const eraserButton = document.getElementById("eraserBtn");
const textButton = document.getElementById("textBtn");
const lineButton = document.getElementById("lineBtn");
const circleButton = document.getElementById("circleBtn");
const rectangleButton = document.getElementById("rectangleBtn");
const triangleButton = document.getElementById("triangleBtn");
const fillCheckbox = document.getElementById("fillCheckbox"); // Checkbox for shape fill
const clearButton = document.getElementById("clearBtn");
const undoButton = document.getElementById("undoBtn");
const redoButton = document.getElementById("redoBtn");
const uploadButton = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const downloadButton = document.getElementById("downloadBtn");

// State variables
let painting = false; // Whether the user is currently drawing
let erasing = false; // Whether the eraser tool is active
let undoStack = []; // Stack to store canvas states for undo/redo
let lastX, lastY; // Last mouse coordinates
let undoPointer = -1; // Pointer for undo/redo stack
let cursorTool = "Brush"; // Current tool
let selectedFontFamily = "Arial"; // Default font family
let selectedFontSize = "12px"; // Default font size
let isShapeFilled = false; // Whether shapes are filled

// Function to update the displayed time (UTC+8)
function updateTime() {
  const now = new Date();
  const hours = now.getUTCHours() + 8; // Adjust to UTC+8
  const minutes = now.getUTCMinutes();
  const seconds = now.getUTCSeconds();
  document.getElementById('timeText').textContent = `${(hours % 24).toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Update the time every second
setInterval(updateTime, 1000);

// Initialize the canvas and tools on page load
window.addEventListener("load", () => {
  saveState(); // Save the initial state of the canvas
  updateColor(); // Set the initial color
  updateTime(); // Display the current time
  canvas.style.cursor = "url('./src/brush_icon.png'), auto"; // Set default cursor to brush
});

// Event listeners for RGB sliders to update the color
redSlider.addEventListener("input", updateColor);
greenSlider.addEventListener("input", updateColor);
blueSlider.addEventListener("input", updateColor);

// Function to update the current drawing color
function updateColor() {
  const redValue = redSlider.value;
  const greenValue = greenSlider.value;
  const blueValue = blueSlider.value;
  const newColor = `rgb(${redValue}, ${greenValue}, ${blueValue})`;

  context.strokeStyle = newColor; // Set stroke color
  context.fillStyle = newColor; // Set fill color

  // Update the color display
  currentColorDiv.style.backgroundColor = newColor;
}

// Function to start drawing or handle text input
function startDraw(e) {
  if (cursorTool === "Text") {
    // Handle text input
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
      context.font = `${selectedFontSize} ${selectedFontFamily}`; // Set font style
      context.fillText(textInput.value, mouseX, mouseY); // Draw the text on the canvas
      saveState(); // Save the canvas state
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

  // Start drawing
  painting = true;
  lastX = e.clientX - canvas.getBoundingClientRect().left;
  lastY = e.clientY - canvas.getBoundingClientRect().top;

  context.lineWidth = brushSize.value; // Set brush size
  context.lineCap = "round"; // Set line cap style
  context.beginPath(); // Begin a new path
}

// Function to handle drawing on the canvas
function draw(e) {
  if (!painting) return; // Exit if not painting

  let mouseX = e.clientX - canvas.getBoundingClientRect().left;
  let mouseY = e.clientY - canvas.getBoundingClientRect().top;

  if (cursorTool === "Eraser") context.globalCompositeOperation = "destination-out"; // Erase mode
  else context.globalCompositeOperation = "source-over"; // Normal drawing mode

  if (cursorTool === "Eraser" || cursorTool === "Brush") {
    context.lineTo(mouseX, mouseY); // Draw a line to the current mouse position
    context.stroke(); // Render the line
  } else if (cursorTool === "Line") {
    context.putImageData(undoStack[undoPointer], 0, 0); // Restore the previous state
    context.beginPath();
    context.moveTo(lastX, lastY); // Start point of the line
    context.lineTo(mouseX, mouseY); // End point of the line
    context.stroke(); // Render the line
  } else if (cursorTool === "Circle") {
    context.putImageData(undoStack[undoPointer], 0, 0); // Restore the previous state
    let radius = Math.sqrt((lastX - mouseX) * (lastX - mouseX) + (lastY - mouseY) * (lastY - mouseY)); // Calculate radius
    context.beginPath();
    context.arc(lastX, lastY, radius, 0, 2 * Math.PI); // Draw the circle
    isShapeFilled ? context.fill() : context.stroke(); // Fill or stroke the circle
  } else if (cursorTool === "Rectangle") {
    context.putImageData(undoStack[undoPointer], 0, 0); // Restore the previous state
    context.beginPath();
    isShapeFilled ? context.fillRect(lastX, lastY, mouseX - lastX, mouseY - lastY) : context.strokeRect(lastX, lastY, mouseX - lastX, mouseY - lastY); // Draw the rectangle
  } else if (cursorTool === "Triangle") {
    context.putImageData(undoStack[undoPointer], 0, 0); // Restore the previous state
    context.beginPath();
    context.moveTo(lastX, lastY); // First vertex
    context.lineTo(lastX + (mouseX - lastX), mouseY); // Second vertex
    context.lineTo(lastX + (lastX - mouseX), mouseY); // Third vertex
    context.closePath(); // Close the path
    isShapeFilled ? context.fill() : context.stroke(); // Fill or stroke the triangle
  } else {
    console.log("cursorTool error:" + cursorTool); // Log error for unsupported tool
  }
}

// Function to save the current canvas state
function saveState() {
  let currentState = context.getImageData(0, 0, canvas.width, canvas.height); // Get the current canvas state
  undoStack.splice(undoPointer + 1); // Remove states after the current pointer
  undoStack.push(currentState); // Add the current state to the stack
  undoPointer++; // Move the pointer forward
}

// Event listeners for tool buttons
clearButton.addEventListener("click", () => {
  context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
  saveState(); // Save the cleared state
});

brushButton.addEventListener("click", () => {
  cursorTool = "Brush"; // Set tool to brush
  canvas.style.cursor = "url('./src/brush_icon.png'), auto"; // Update cursor
  document.querySelector(".container .controls .active").classList.remove("active"); // Remove active class from other buttons
  brushButton.classList.add("active"); // Add active class to brush button
});

eraserButton.addEventListener("click", () => {
  cursorTool = "Eraser"; // Set tool to eraser
  canvas.style.cursor = "url('./src/eraser_icon.png'), auto"; // Update cursor
  document.querySelector(".container .controls .active").classList.remove("active"); // Remove active class from other buttons
  eraserButton.classList.add("active"); // Add active class to eraser button
});

lineButton.addEventListener("click", () => {
  cursorTool = "Line"; // Set tool to line
  canvas.style.cursor = "url('./src/line_icon.png'), auto"; // Update cursor
  document.querySelector(".container .controls .active").classList.remove("active"); // Remove active class from other buttons
  lineButton.classList.add("active"); // Add active class to line button
});

circleButton.addEventListener("click", () => {
  cursorTool = "Circle"; // Set tool to circle
  canvas.style.cursor = "url('./src/circle_icon.png'), auto"; // Update cursor
  document.querySelector(".container .controls .active").classList.remove("active"); // Remove active class from other buttons
  circleButton.classList.add("active"); // Add active class to circle button
});

rectangleButton.addEventListener("click", () => {
  cursorTool = "Rectangle"; // Set tool to rectangle
  canvas.style.cursor = "url('./src/rectangle_icon.png'), auto"; // Update cursor
  document.querySelector(".container .controls .active").classList.remove("active"); // Remove active class from other buttons
  rectangleButton.classList.add("active"); // Add active class to rectangle button
});

triangleButton.addEventListener("click", () => {
  cursorTool = "Triangle"; // Set tool to triangle
  canvas.style.cursor = "url('./src/triangle_icon.png'), auto"; // Update cursor
  document.querySelector(".container .controls .active").classList.remove("active"); // Remove active class from other buttons
  triangleButton.classList.add("active"); // Add active class to triangle button
});

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

uploadButton.addEventListener("click", async () => {
  await new Promise(resolve => {
    fileInput.addEventListener("change", resolve, { once: true }); // Wait for file input
    fileInput.click(); // Trigger file input click
  });

  const file = fileInput.files[0]; // Get the selected file
  if (file) {
    const reader = new FileReader(); // Create a file reader
    reader.onload = function (event) {
      const img = new Image(); // Create an image element
      img.onload = () => {
        context.drawImage(img, 0, 0, canvas.width, canvas.height); // Draw the image on the canvas
        saveState(); // Save the canvas state
      };
      img.src = event.target.result; // Set the image source
    };
    reader.readAsDataURL(file); // Read the file as a data URL
  }
});

downloadButton.addEventListener("click", () => {
  const link = document.createElement("a"); // Create a link element
  link.href = canvas.toDataURL(); // Get the canvas data URL
  link.download = "canvas_image.png"; // Set the filename for the downloaded image
  link.click(); // Simulate a click on the link to start the download
});

textButton.addEventListener("click", () => {
  cursorTool = "Text"; // Set tool to text
  canvas.style.cursor = "url('./src/text_icon.png'), auto"; // Update cursor
  document.querySelector(".container .controls .active").classList.remove("active"); // Remove active class from other buttons
  textButton.classList.add("active"); // Add active class to text button
});

fontFamilySelect.addEventListener("change", () => {
  selectedFontFamily = fontFamilySelect.value; // Update selected font family
});

fontSizeSelect.addEventListener("change", () => {
  selectedFontSize = fontSizeSelect.value + "px"; // Update selected font size
});

fillCheckbox.addEventListener("change", () => {
  isShapeFilled = fillCheckbox.checked; // Update shape fill state
});

// Event listeners for canvas actions
canvas.addEventListener("mousedown", startDraw); // Start drawing
canvas.addEventListener("mousemove", draw); // Handle drawing
canvas.addEventListener("mouseup", () => {
  if (cursorTool !== "Text") {
    painting = false; // Stop painting
    saveState(); // Save the canvas state
  }
});
canvas.addEventListener("mouseout", () => {
  if (!painting) return; // Exit if not painting
  if (cursorTool !== "Text") {
    painting = false; // Stop painting
    saveState(); // Save the canvas state
  }
});