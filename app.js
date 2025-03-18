let video = document.getElementById('camera');
let scanResult = document.getElementById('scan-result');

function startScanner() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(function(stream) {
        video.srcObject = stream;
        scanQRCode();
    }).catch(err => {
        console.error("Error accessing camera: ", err);
    });
}

function scanQRCode() {
    let canvas = document.createElement("canvas");
    let context = canvas.getContext("2d");

    setInterval(() => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        let code = jsQR(imageData.data, canvas.width, canvas.height);
        
        if (code) {
            scanResult.innerText = `Scanned Room: ${code.data}`;
            saveToGoogleSheets(code.data);
        }
    }, 1000);
}

function saveToGoogleSheets(roomNumber) {
    let employee = document.getElementById("employee").value;
    if (!employee) {
        alert("Enter your name before scanning!");
        return;
    }

    let timestamp = new Date().toISOString();

    fetch("https://script.google.com/macros/s/YOUR_DEPLOYED_SCRIPT_URL/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: roomNumber, employee: employee, timestamp: timestamp })
    }).then(response => response.json())
    .then(data => {
        alert("Scan recorded!");
        addRowToTable(roomNumber, employee, timestamp);
    }).catch(error => console.error("Error saving data:", error));
}

function addRowToTable(room, employee, timestamp) {
    let table = document.getElementById("log-table");
    let row = table.insertRow();
    row.insertCell(0).innerText = room;
    row.insertCell(1).innerText = employee;
    row.insertCell(2).innerText = timestamp;
}
