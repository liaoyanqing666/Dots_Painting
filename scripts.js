document.addEventListener("DOMContentLoaded", function() {
    const imageInput = document.getElementById("imageInput");
    const dropZone = document.getElementById("dropZone");
    const resolutionDisplay = document.getElementById("resolutionDisplay");
    const outputText = document.getElementById("outputText");
    const widthInput = document.getElementById("widthInput");
    const heightInput = document.getElementById("heightInput");
    const fontSizeInput = document.getElementById("fontSize");
    const fontSizeValue = document.getElementById("fontSizeInput");
    const styleSelect = document.getElementById("styleSelect");
    const thresholdSlider = document.getElementById("threshold");
    const thresholdValue = document.getElementById("thresholdValue");
    const imagePreview = document.getElementById("imagePreview");
    const copyButton = document.getElementById("copyButton");

    let image = new Image();

    dropZone.addEventListener("click", () => imageInput.click());
    imageInput.addEventListener("change", handleImageUpload);
    dropZone.addEventListener("dragover", (event) => {
        event.preventDefault();
        dropZone.classList.add("dragging");
    });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragging"));
    dropZone.addEventListener("drop", (event) => {
        event.preventDefault();
        dropZone.classList.remove("dragging");
        const file = event.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            loadImage(file);
        }
    });

    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith("image/")) {
            loadImage(file);
        }
    }

    function loadImage(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            image.onload = function() {
                resolutionDisplay.textContent = `Resolution: ${image.width}x${image.height}`;
                generateAsciiArt();
                imagePreview.style.display = 'block';
                imagePreview.src = e.target.result;
            };
            image.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    copyButton.addEventListener("click", () => {
        outputText.select();
        document.execCommand("copy");
    });

    thresholdSlider.addEventListener("input", () => {
        thresholdValue.textContent = thresholdSlider.value;
        generateAsciiArt();
    });

    widthInput.addEventListener("input", generateAsciiArt);
    heightInput.addEventListener("input", generateAsciiArt);
    fontSizeInput.addEventListener("input", () => {
        fontSizeValue.value = fontSizeInput.value;
        generateAsciiArt();
    });
    fontSizeValue.addEventListener("input", () => {
        fontSizeInput.value = fontSizeValue.value;
        generateAsciiArt();
    });
    styleSelect.addEventListener("change", generateAsciiArt);

    function generateAsciiArt() {
        if (!image.src) return;

        const canvas = document.createElement("canvas");
        const width = parseInt(widthInput.value);
        const height = parseInt(heightInput.value);
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);

        outputText.value = processByStyle(
            imageData,
            styleSelect.value,
            thresholdSlider.value
        );
        outputText.style.fontSize = `${fontSizeInput.value}px`;
    }

    function processByStyle(imageData, style, threshold) {
        const processors = {
            dot: processDot,
            braille: processBraille,
        };
        return (processors[style] || processDot)(imageData, threshold);
    }

    function processDot(imageData, threshold) {
        let result = "";
        const data = imageData.data;
        for (let y = 0; y < imageData.height; y++) {
            let line = "";
            for (let x = 0; x < imageData.width; x++) {
                const i = (y * imageData.width + x) * 4;
                const gray = (data[i] + data[i+1] + data[i+2]) / 3;
                line += gray >= threshold ? "." : " ";
            }
            result += line + "\n";
        }
        return result;
    }

    // Braille encoding is divided into two types: six-point ⠿ and eight-point ⣿. Among them, six-point is encoded in binary according to the method of from top to bottom and from left to right. Eight-point adds two points at the bottom of six-point, and the encoding method is to encode the first six points first, and then encode the last two points from left to right. Therefore, for the convenience of the code, only the Braille encoding of six points is temporarily implemented.
    // Reference: https://www.compart.com/en/unicode/block/U+2800
    function processBraille(imageData, threshold) {
        let result = "";
        const data = imageData.data;
        for (let y = 0; y < imageData.height; y += 3) {
            let line = "";
            for (let x = 0; x < imageData.width; x += 2) {
                let bits = 0;
                for (let dy = 0; dy < 3; dy++) {
                    for (let dx = 0; dx < 2; dx++) {
                        const px = x + dx;
                        const py = y + dy;
                        if (px >= imageData.width || py >= imageData.height) continue;
                        
                        const i = (py * imageData.width + px) * 4;
                        const gray = (data[i] + data[i+1] + data[i+2]) / 3;
                        if (gray >= threshold) {
                            bits |= 1 << (dy * 2 + dx);
                        }
                    }
                }
                line += String.fromCharCode(0x2800 + bits);
            }
            result += line + "\n";
        }
        return result;
    }
});