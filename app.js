let video = document.getElementById('camera');
let scanResult = document.getElementById('scan-result');
let scanning = false; // Prevent multiple scans

async function startScanner() {
    scanning = false;
    let stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    
    video.srcObject = stream;
    video.setAttribute("playsinline", true); // Required for mobile
    video.play();
    
    scanQRCode();
}

function scanQRCode() {
    let canvas = document.createElement("canvas");
    let context = canvas.getContext("2d");

    let scanInterval = setInterval(() => {
        if (!video.videoWidth || !video.videoHeight) return;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        let code = jsQR(imageData.data, canvas.width, canvas.height);

        if (code && !scanning) {
            scanning = true; // Prevent multiple scans
            scanResult.innerText = `Scanned Room: ${code.data}`;
            clearInterval(scanInterval); // Stop scanning
            stopScanner(); // Stop camera
            saveToGoogleSheets(code.data);
        }
    }, 500); // Scans every 500ms
}

function stopScanner() {
    let stream = video.srcObject;
    if (stream) {
        let tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
    }
}

function saveToGoogleSheets(roomNumber) {
    let employee = document.getElementById("employee").value;
    if (!employee) {
        alert("Enter your name before scanning!");
        scanning = false; // Allow re-scanning
        return;
    }

    let timestamp = new Date().toISOString();

    fetch("https://script.google.com/macros/s/AKfycbx1eM4qCf2Jp2h26iaan7xzA0Ieouv9uF3KD9ENF6ppYBLNLSQR-y0CQThVgQgAURRG-w/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: roomNumber, employee: employee, timestamp: timestamp })
    })
    .then(response => response.json())
    .then(data => {
        alert("Scan recorded!");
        addRowToTable(roomNumber, employee, timestamp);
    })
    .catch(error => {
        console.error("Error saving data:", error);
        scanning = false; // Allow re-scanning if there's an error
    });
}

function addRowToTable(room, employee, timestamp) {
    let table = document.getElementById("log-table");
    let row = table.insertRow();
    row.insertCell(0).innerText = room;
    row.insertCell(1).innerText = employee;
    row.insertCell(2).innerText = timestamp;
}
