
// ============================================
// SERVER MONITORING DASHBOARD
// ============================================

const REFRESH_INTERVAL = 5000;
const MAX_HISTORY = 60;

let previousNetwork = null;

const history = {
    cpu: [],
    memory: [],
    download: [],
    upload: []
};


// ============================================
// 1. HELPER FUNCTIONS
// ============================================

function formatBytes(bytes) {

    if (bytes < 1024) {
        return bytes + " B";
    }

    const units = ["KB", "MB", "GB", "TB"];

    let value = bytes / 1024;
    let index = 0;

    while (value >= 1024 && index < units.length - 1) {
        value /= 1024;
        index++;
    }

    return value.toFixed(2) + " " + units[index];
}


function addHistory(key, value) {

    history[key].push(value);

    if (history[key].length > MAX_HISTORY) {
        history[key].shift();
    }
}


function setText(id, value) {

    document.getElementById(id).textContent = value;
}


// ============================================
// 2. HEALTH INDICATORS
// ============================================

function updateHealth(id, status) {

    const element = document.getElementById(id);

    element.textContent = status;

    element.className = "health-tag";

    if (status === "Warning") {
        element.classList.add("warning");
    }

    if (status === "Critical") {
        element.classList.add("critical");
    }
}


function updateProgress(id, value) {

    const element = document.getElementById(id);

    const percentage = Math.max(0, Math.min(100, value));

    element.style.width = percentage + "%";

    element.className = "progress-fill";

    if (value >= 90) {
        element.classList.add("critical");
    } else if (value >= 80) {
        element.classList.add("warning");
    }
}


function updateOverallHealth(status) {

    setText("overallHealth", status);

    const dot = document.getElementById("overallDot");

    const colors = {
        Healthy: "#22c55e",
        Warning: "#f59e0b",
        Critical: "#ef4444"
    };

    dot.style.background = colors[status] || "#94a3b8";
}


// ============================================
// 3. NETWORK SPEED CALCULATION
// ============================================

function calculateNetwork(data) {

    const now = performance.now();

    let downloadMbps = 0;
    let uploadMbps = 0;

    if (previousNetwork !== null) {

        const elapsed =
            (now - previousNetwork.time) / 1000;

        if (elapsed > 0) {

            const received =
                Math.max(
                    0,
                    data.network_bytes_received -
                    previousNetwork.received
                );

            const sent =
                Math.max(
                    0,
                    data.network_bytes_sent -
                    previousNetwork.sent
                );

            downloadMbps =
                received * 8 / elapsed / 1000000;

            uploadMbps =
                sent * 8 / elapsed / 1000000;
        }
    }

    previousNetwork = {
        time: now,
        received: data.network_bytes_received,
        sent: data.network_bytes_sent
    };

    setText("downloadSpeed", downloadMbps.toFixed(3) + " Mbps");

    setText("uploadSpeed", uploadMbps.toFixed(3) + " Mbps");

    setText(
        "receivedTotal",
        "Total received: " + formatBytes(data.network_bytes_received)
    );

    setText(
        "sentTotal",
        "Total sent: " + formatBytes(data.network_bytes_sent)
    );

    addHistory("download", downloadMbps);
    addHistory("upload", uploadMbps);
}


// ============================================
// 4. HISTORICAL CHART DRAWING
// ============================================

function drawChart(canvasId, values, label, maxValue, suffix = "%") {

    const canvas = document.getElementById(canvasId);

    const width = canvas.clientWidth;

    const height = 190;

    if (width <= 0) return;

    const ratio = window.devicePixelRatio || 1;

    canvas.width = width * ratio;
    canvas.height = height * ratio;

    const ctx = canvas.getContext("2d");

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    ctx.clearRect(0, 0, width, height);

    const left = 42;
    const right = 10;
    const top = 12;
    const bottom = 25;

    const chartWidth = width - left - right;
    const chartHeight = height - top - bottom;

    // Draw reference lines

    ctx.strokeStyle = "#293851";
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px Arial";

    for (let i = 0; i <= 4; i++) {

        const y = top + chartHeight * i / 4;

        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(width - right, y);
        ctx.stroke();

        const value = maxValue * (1 - i / 4);

        ctx.fillText(
            value.toFixed(0) + suffix,
            0,
            y + 4
        );
    }

    if (values.length === 0) return;

    // Draw history line

    ctx.beginPath();

    ctx.strokeStyle = "#60a5fa";
    ctx.lineWidth = 2;

    values.forEach((value, index) => {

        const x = left +
            (index / Math.max(MAX_HISTORY - 1, 1)) * chartWidth;

        const normalized =
            Math.max(0, Math.min(maxValue, value));

        const y = top +
            chartHeight * (1 - normalized / maxValue);

        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();

    // Draw current value

    const current = values[values.length - 1];

    ctx.fillStyle = "#e5edf8";
    ctx.font = "12px Arial";

    ctx.fillText(
        label + ": " + current.toFixed(2) + suffix,
        left,
        height - 4
    );
}


function drawAllCharts() {

    drawChart(
        "cpuChart",
        history.cpu,
        "CPU",
        100
    );

    drawChart(
        "memoryChart",
        history.memory,
        "Memory",
        100
    );

    const networkMaximum = Math.max(
        10,
        ...history.download,
        ...history.upload
    );

    drawChart(
        "networkChart",
        history.download.map(
            (value, index) =>
                Math.max(value, history.upload[index] || 0)
        ),
        "Peak traffic",
        Math.ceil(networkMaximum),
        " Mbps"
    );
}


// ============================================
// 5. PROCESS TABLES
// ============================================

function renderProcesses(elementId, processes, mode) {

    const tbody = document.getElementById(elementId);

    tbody.replaceChildren();

    if (!Array.isArray(processes) || processes.length === 0) {

        const row = document.createElement("tr");

        const cell = document.createElement("td");

        cell.colSpan = 4;
        cell.textContent = "No process information available";

        row.appendChild(cell);
        tbody.appendChild(row);

        return;
    }

    processes.forEach(process => {

        const row = document.createElement("tr");

        const values = [
            process.pid,
            process.name,
            mode === "cpu"
                ? process.cpu_percent.toFixed(2) + "%"
                : process.memory_percent.toFixed(2) + "%",
            process.memory_mb.toFixed(2) + " MB"
        ];

        values.forEach(value => {

            const cell = document.createElement("td");

            cell.textContent = value;

            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });
}


// ============================================
// 6. ALERT MANAGEMENT
// ============================================

function renderAlerts(alerts, overallHealth) {

    const container = document.getElementById("alertsList");

    container.replaceChildren();

    const count = Array.isArray(alerts) ? alerts.length : 0;

    setText(
        "alertCount",
        count + (count === 1 ? " Alert" : " Alerts")
    );

    if (count === 0) {

        const item = document.createElement("div");

        item.className = "alert-item healthy";

        const message = document.createElement("span");

        message.className = "alert-message";

        message.textContent =
            overallHealth === "Healthy"
                ? "All monitored resources are operating within configured thresholds."
                : "No resource threshold alerts are currently reported.";

        item.appendChild(message);

        container.appendChild(item);

        return;
    }

    alerts.forEach(alert => {

        const item = document.createElement("div");

        item.className =
            "alert-item " + alert.severity.toLowerCase();

        const message = document.createElement("span");

        message.className = "alert-message";

        message.textContent =
            alert.severity + " - " +
            alert.metric + ": " +
            alert.message + " (" +
            alert.value + "%)";

        item.appendChild(message);

        container.appendChild(item);
    });
}


// ============================================
// 7. MAIN METRICS COLLECTION
// ============================================

async function getMetrics() {

    try {

        const response = await fetch("/metrics", {
            cache: "no-store"
        });

        if (!response.ok) {

            throw new Error(
                "Metrics API returned HTTP " + response.status
            );
        }

        const data = await response.json();

        if (!data.hostname ||
            !Array.isArray(data.top_cpu_processes) ||
            !Array.isArray(data.top_memory_processes) ||
            !Array.isArray(data.alerts)) {

            throw new Error("Invalid metrics response");
        }

        // Server information

        setText("hostname", data.hostname);

        setText(
            "os",
            data.operating_system + " " + data.os_version
        );

        setText("cpuCount", data.cpu_count);

        setText("uptime", data.uptime);

        // CPU

        setText("cpu", data.cpu_usage.toFixed(1) + "%");

        updateProgress("cpuBar", data.cpu_usage);

        updateHealth("cpuHealth", data.cpu_health);

        // Memory

        setText("memory", data.memory_usage.toFixed(1) + "%");

        setText(
            "memoryDetails",
            "Used: " + data.used_memory +
            " GB | Available: " + data.available_memory +
            " GB | Total: " + data.total_memory + " GB"
        );

        updateProgress("memoryBar", data.memory_usage);

        updateHealth("memoryHealth", data.memory_health);

        // Disk

        setText("disk", data.disk_usage.toFixed(1) + "%");

        setText(
            "diskDetails",
            "Used: " + data.used_disk +
            " GB | Free: " + data.free_disk +
            " GB | Total: " + data.total_disk + " GB"
        );

        updateProgress("diskBar", data.disk_usage);

        updateHealth("diskHealth", data.disk_health);

        // Overall health

        updateOverallHealth(data.overall_health);

        // Network

        calculateNetwork(data);

        // Historical data

        addHistory("cpu", data.cpu_usage);

        addHistory("memory", data.memory_usage);

        drawAllCharts();

        // Processes

        renderProcesses(
            "cpuProcesses",
            data.top_cpu_processes,
            "cpu"
        );

        renderProcesses(
            "memoryProcesses",
            data.top_memory_processes,
            "memory"
        );

        // Alerts

        renderAlerts(
            data.alerts,
            data.overall_health
        );

        // Last updated

        setText(
            "lastUpdated",
            "Last updated: " + new Date().toLocaleTimeString()
        );

        setText(
            "connectionStatus",
            "Monitoring active"
        );

    }

    catch (error) {

        setText(
            "connectionStatus",
            "Monitoring error: " + error.message
        );

    }
}


// ============================================
// 8. START MONITORING
// ============================================

getMetrics();

setInterval(
    getMetrics,
    REFRESH_INTERVAL
);

window.addEventListener(
    "resize",
    drawAllCharts
);
