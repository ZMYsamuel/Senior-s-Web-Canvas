const canvas = document.getElementById("paintCanvas");
const context = canvas.getContext("2d");
// sliders
const redSlider = document.getElementById("redSlider");
const greenSlider = document.getElementById("greenSlider");
const blueSlider = document.getElementById("blueSlider");
const currentColorDiv = document.getElementById("currentColor");
const brushSize = document.getElementById("brushSize");
const redValue = redSlider.value;
const greenValue = greenSlider.value;
const blueValue = blueSlider.value;
// fonts
const fontFamilySelect = document.getElementById("fontFamilySelect");
const fontSizeSelect = document.getElementById("fontSizeSelect");
// buttons
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

let painting = false;
let erasing = false;
let undoStack = [];
let lastX, lastY;
let undoPointer = -1;
let cursorTool = "Brush";
let selectedFontFamily = "Arial";
let selectedFontSize = "12px";
let isShapeFilled = false;

function updateTime() {
  const now = new Date();
  const hours = now.getUTCHours() + 8; // UTC+8
  const minutes = now.getUTCMinutes();
  const seconds = now.getUTCSeconds();
  document.getElementById('timeText').textContent = `${(hours % 24).toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

setInterval(updateTime, 1000);

// Init
window.addEventListener("load", () => {
  saveState();
  updateColor();
  updateTime();
  canvas.style.cursor = "url('./src/brush_icon.png'), auto";  
});

redSlider.addEventListener("input", updateColor);
greenSlider.addEventListener("input", updateColor);
blueSlider.addEventListener("input", updateColor);

function updateColor() {
  const redValue = redSlider.value;
  const greenValue = greenSlider.value;
  const blueValue = blueSlider.value;
  const newColor = `rgb(${redValue}, ${greenValue}, ${blueValue})`;

  context.strokeStyle = newColor;
  context.fillStyle = newColor;

  // Display the current color
  currentColorDiv.style.backgroundColor = newColor;
}

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
      context.font = `${selectedFontSize} ${selectedFontFamily}`
      context.fillText(textInput.value, mouseX, mouseY);
      saveState();
    };
  
    textInput.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleTextInput();
      }
    });
  
    // textInput.addEventListener("blur", handleTextInput);
    // canvas.addEventListener("click", handleTextInput);
  
    document.body.appendChild(textInput);
    textInput.focus();
    return;
  }

  painting = true;
  lastX = e.clientX - canvas.getBoundingClientRect().left;
  lastY = e.clientY - canvas.getBoundingClientRect().top;
  
  context.lineWidth = brushSize.value;
  context.lineCap = "round";
  context.beginPath();
}

function draw(e) {
  if (!painting) return;

  let mouseX = e.clientX - canvas.getBoundingClientRect().left;
  let mouseY = e.clientY - canvas.getBoundingClientRect().top;

  if (cursorTool === "Eraser") context.globalCompositeOperation = "destination-out";
  else context.globalCompositeOperation = "source-over";

  if (cursorTool === "Eraser" || cursorTool === "Brush") {
    context.lineTo(mouseX, mouseY);
    context.stroke();
  }
  else if (cursorTool === "Line") {
    context.putImageData(undoStack[undoPointer], 0, 0);
    context.beginPath();
    context.moveTo(lastX, lastY);
    context.lineTo(mouseX, mouseY);
    context.stroke();
  }
  else if (cursorTool === "Circle") {
    context.putImageData(undoStack[undoPointer], 0, 0);
    let radius = Math.sqrt((lastX - mouseX) * (lastX - mouseX) + (lastY - mouseY) * (lastY - mouseY));
    context.beginPath();
    context.arc(lastX, lastY, radius, 0, 2 * Math.PI);
    isShapeFilled ? context.fill() : context.stroke();
  }
  else if (cursorTool === "Rectangle") {
    context.putImageData(undoStack[undoPointer], 0, 0);
    context.beginPath();
    isShapeFilled ? context.fillRect(lastX, lastY, mouseX - lastX, mouseY - lastY) : context.strokeRect(lastX, lastY, mouseX - lastX, mouseY - lastY);
  }
  else if (cursorTool === "Triangle") {
    context.putImageData(undoStack[undoPointer], 0, 0);
    context.beginPath();
    context.moveTo(lastX, lastY);
    context.lineTo(lastX + (mouseX - lastX), mouseY);
    context.lineTo(lastX + (lastX - mouseX), mouseY);
    context.closePath();
    isShapeFilled ? context.fill() : context.stroke();
  }
  else {
    console.log("cursorTool error:" + cursorTool);
  }
}

function saveState() {
  let currentState = context.getImageData(0, 0, canvas.width, canvas.height);
  // Discard the states after the current pointer
  // while (undoStack[undoStack.length - 1] === currentState) undoStack.pop();
  undoStack.splice(undoPointer + 1);
  undoStack.push(currentState);
  undoPointer++;
}

clearButton.addEventListener("click", () => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  saveState();
});

brushButton.addEventListener("click", () => {
  cursorTool = "Brush";
  canvas.style.cursor = "url('./src/brush_icon.png'), auto";
  document.querySelector(".container .controls .active").classList.remove("active");
  brushButton.classList.add("active");
});

eraserButton.addEventListener("click", () => {
  cursorTool = "Eraser";
  canvas.style.cursor = "url('./src/eraser_icon.png'), auto";
  document.querySelector(".container .controls .active").classList.remove("active");
  eraserButton.classList.add("active");
});

lineButton.addEventListener("click", () => {
  cursorTool = "Line";
  canvas.style.cursor = "url('./src/line_icon.png'), auto";
  document.querySelector(".container .controls .active").classList.remove("active");
  lineButton.classList.add("active");
});

circleButton.addEventListener("click", () => {
  cursorTool = "Circle";
  canvas.style.cursor = "url('./src/circle_icon.png'), auto";
  document.querySelector(".container .controls .active").classList.remove("active");
  circleButton.classList.add("active");
});

rectangleButton.addEventListener("click", () => {
  cursorTool = "Rectangle";
  canvas.style.cursor = "url('./src/rectangle_icon.png'), auto";
  document.querySelector(".container .controls .active").classList.remove("active");
  rectangleButton.classList.add("active");
});

triangleButton.addEventListener("click", () => {
  cursorTool = "Triangle";
  canvas.style.cursor = "url('./src/triangle_icon.png'), auto";
  document.querySelector(".container .controls .active").classList.remove("active");
  triangleButton.classList.add("active");
});

undoButton.addEventListener("click", () => {
  if (undoPointer > 0) {
    undoPointer--;
    context.putImageData(undoStack[undoPointer], 0, 0);
  }
});

redoButton.addEventListener("click", () => {
  if (undoPointer < undoStack.length - 1) {
    undoPointer++;
    context.putImageData(undoStack[undoPointer], 0, 0);
  }
});

uploadButton.addEventListener("click", async () => {
  await new Promise(resolve => {
    fileInput.addEventListener("change", resolve, { once: true });
    fileInput.click();
  });

  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = () => {
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        saveState();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }
});

downloadButton.addEventListener("click", () => {
  const link = document.createElement("a");
  link.href = canvas.toDataURL();
  link.download = "canvas_image.png"; // Set the filename for the downloaded image
  link.click(); // Simulate a click on the link to start the download
});

textButton.addEventListener("click", () => {
  cursorTool = "Text";
  canvas.style.cursor = "url('./src/text_icon.png'), auto";
  document.querySelector(".container .controls .active").classList.remove("active");
  textButton.classList.add("active");
});

fontFamilySelect.addEventListener("change", () => {
  selectedFontFamily = fontFamilySelect.value;
});

fontSizeSelect.addEventListener("change", () => {
  selectedFontSize = fontSizeSelect.value + "px";
});

fillCheckbox.addEventListener("change", () => {
  isShapeFilled = fillCheckbox.checked;
});

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", () => {
  if (cursorTool !== "Text") {
    painting = false;
    saveState();
  }
});
canvas.addEventListener("mouseout", () => {
  if (!painting) return;
  if (cursorTool !== "Text") {
    painting = false;
    saveState();
  }
});