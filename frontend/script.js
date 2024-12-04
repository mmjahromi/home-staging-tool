const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const browseButton = document.getElementById('browseButton');
const maskCanvas = document.createElement('canvas');
const maskCtx = maskCanvas.getContext('2d');
const brushSizeInput = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const removeObjectButton = document.getElementById('removeObject');
const undoButton = document.getElementById('undoAction');
const clearButton = document.getElementById('clearSelection');
let img = new Image();
let brushSize = 20;
let isDrawing = false;
let strokes = [];

// Debugging Images
function updateDebugImages() {
    document.getElementById('debug-original-image').src = canvas.toDataURL('image/png');
    document.getElementById('debug-mask-image').src = maskCanvas.toDataURL('image/png');
}

// Clamp Values to Prevent Drawing Outside Canvas
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Update Brush Preview
function updateBrushPreview() {
    const brushPreview = document.getElementById('brushPreview');
    brushPreview.style.width = `${brushSize}px`;
    brushPreview.style.height = `${brushSize}px`;
    brushPreview.style.borderRadius = '50%';
    brushPreview.style.border = '1px solid red';
    brushPreview.style.position = 'absolute';
    brushPreview.style.left = `0px`;
    brushPreview.style.top = `0px`;
}
updateBrushPreview();

// Update Brush Size
brushSizeInput.addEventListener('input', () => {
    brushSize = parseInt(brushSizeInput.value, 10);
    brushSizeValue.textContent = brushSize;
    updateBrushPreview();
});

// Browse Image
browseButton.addEventListener('click', () => {
    console.log('Browse Image button clicked'); // Debug log
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        console.log('File input triggered'); // Debug log
        const file = e.target.files[0];
        if (!file) {
            console.log('No file selected'); // Debug log
            return;
        }
        console.log('File selected:', file.name); // Debug log
        loadImage(file);
    };
    input.click();
});


// Load Image into Canvas
function loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        img.src = e.target.result;
        console.log('Image loaded successfully'); // Debug log
    };
    reader.readAsDataURL(file);
}


img.onload = () => {
    console.log('Image displayed on canvas'); // Debug log
    const maxWidth = window.innerWidth * 0.8;
    const maxHeight = window.innerHeight * 0.8;
    const scale = Math.min(maxWidth / img.width, maxHeight / img.height);

    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
};

// Drawing Brush Tool
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    strokes.push(maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height));
    drawBrush(e.offsetX, e.offsetY);
});

canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
        drawBrush(e.offsetX, e.offsetY);
    }
    const brushPreview = document.getElementById('brushPreview');
    brushPreview.style.left = `${e.clientX - brushSize / 2}px`;
    brushPreview.style.top = `${e.clientY - brushSize / 2}px`;
});

canvas.addEventListener('mouseup', () => (isDrawing = false));

// Draw Brush
function drawBrush(x, y) {
    x = clamp(x, 0, canvas.width);
    y = clamp(y, 0, canvas.height);

    maskCtx.fillStyle = 'black';
    maskCtx.beginPath();
    maskCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    maskCtx.fill();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 0.5;
    ctx.drawImage(maskCanvas, 0, 0);
    ctx.globalAlpha = 1.0;

    updateDebugImages();
}

// Remove Object
removeObjectButton.addEventListener('click', () => {
    const imageBase64 = canvas.toDataURL('image/png');
    const maskBase64 = maskCanvas.toDataURL('image/png');

    fetch('http://localhost:8080/api/v1/inpaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64, mask: maskBase64 }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.result) {
                const resultImg = new Image();
                resultImg.src = 'data:image/png;base64,' + data.result;
                resultImg.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(resultImg, 0, 0);
                };
            }
        })
        .catch((error) => console.error('Error:', error));
});

// Undo Action
undoButton.addEventListener('click', () => {
    if (strokes.length > 0) {
        const lastState = strokes.pop();
        maskCtx.putImageData(lastState, 0, 0);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 0.5;
        ctx.drawImage(maskCanvas, 0, 0);
        ctx.globalAlpha = 1.0;

        updateDebugImages();
    }
});

// Clear Selection
clearButton.addEventListener('click', () => {
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    updateDebugImages();
});
