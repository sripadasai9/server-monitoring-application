
import platform
import socket
import time
import psutil

from datetime import timedelta


# --------------------------------------------------
# 1. HEALTH STATUS CALCULATION
# --------------------------------------------------

def get_health_status(value):

    if value >= 90:
        return "Critical"

    elif value >= 80:
        return "Warning"

    return "Healthy"


# --------------------------------------------------
# 2. PROCESS MONITORING
# --------------------------------------------------

def get_top_processes():

    cpu_processes = []
    memory_processes = []

    for process in psutil.process_iter(
        ["pid", "name", "memory_info"]
    ):

        try:

            with process.oneshot():

                cpu_usage = process.cpu_percent(
                    interval=None
                )

                memory_info = process.info["memory_info"]

                memory_mb = (
                    memory_info.rss / (1024 * 1024)
                    if memory_info else 0
                )

                memory_percent = process.memory_percent()

                process_data = {
                    "pid": process.pid,
                    "name": process.info["name"] or "Unknown",
                    "cpu_percent": round(cpu_usage, 2),
                    "memory_percent": round(memory_percent, 2),
                    "memory_mb": round(memory_mb, 2)
                }

                cpu_processes.append(process_data)

                memory_processes.append(process_data)

        except (
            psutil.NoSuchProcess,
            psutil.AccessDenied,
            psutil.ZombieProcess
        ):
            continue

    # Sort processes by CPU usage

    top_cpu = sorted(
        cpu_processes,
        key=lambda process: process["cpu_percent"],
        reverse=True
    )[:5]

    # Sort processes by memory usage

    top_memory = sorted(
        memory_processes,
        key=lambda process: process["memory_mb"],
        reverse=True
    )[:5]

    return {
        "top_cpu_processes": top_cpu,
        "top_memory_processes": top_memory
    }


# --------------------------------------------------
# 3. ALERT GENERATION
# --------------------------------------------------

def generate_alerts(cpu, memory, disk):

    alerts = []

    metrics = {
        "CPU": cpu,
        "Memory": memory,
        "Disk": disk
    }

    for name, value in metrics.items():

        if value >= 90:

            alerts.append({
                "metric": name,
                "value": round(value, 2),
                "severity": "Critical",
                "message": f"{name} utilization is critically high"
            })

        elif value >= 80:

            alerts.append({
                "metric": name,
                "value": round(value, 2),
                "severity": "Warning",
                "message": f"{name} utilization is above normal threshold"
            })

    return alerts


# --------------------------------------------------
# 4. COLLECT SERVER METRICS
# --------------------------------------------------

def collect_metrics():

    # CPU information

    cpu_usage = psutil.cpu_percent(interval=0.2)

    cpu_count = psutil.cpu_count(logical=True)

    # Memory information

    memory = psutil.virtual_memory()

    # Disk information

    disk = psutil.disk_usage("/")

    # Network information

    network = psutil.net_io_counters()

    # Server information

    hostname = socket.gethostname()

    operating_system = platform.system()

    os_version = platform.release()

    # Server uptime

    uptime_seconds = int(
        time.time() - psutil.boot_time()
    )

    uptime = str(
        timedelta(seconds=uptime_seconds)
    )

    # Calculate health

    cpu_health = get_health_status(cpu_usage)

    memory_health = get_health_status(memory.percent)

    disk_health = get_health_status(disk.percent)

    statuses = [
        cpu_health,
        memory_health,
        disk_health
    ]

    if "Critical" in statuses:

        overall_health = "Critical"

    elif "Warning" in statuses:

        overall_health = "Warning"

    else:

        overall_health = "Healthy"

    # Generate alerts

    alerts = generate_alerts(
        cpu_usage,
        memory.percent,
        disk.percent
    )

    # Collect top processes

    processes = get_top_processes()

    # Return all monitoring information

    return {

        "hostname": hostname,

        "operating_system": operating_system,

        "os_version": os_version,

        "uptime": uptime,

        "cpu_usage": cpu_usage,

        "cpu_count": cpu_count,

        "cpu_health": cpu_health,

        "memory_usage": memory.percent,

        "total_memory": round(
            memory.total / (1024 ** 3), 2
        ),

        "used_memory": round(
            memory.used / (1024 ** 3), 2
        ),

        "available_memory": round(
            memory.available / (1024 ** 3), 2
        ),

        "memory_health": memory_health,

        "disk_usage": disk.percent,

        "total_disk": round(
            disk.total / (1024 ** 3), 2
        ),

        "used_disk": round(
            disk.used / (1024 ** 3), 2
        ),

        "free_disk": round(
            disk.free / (1024 ** 3), 2
        ),

        "disk_health": disk_health,

        "network_bytes_sent": network.bytes_sent,

        "network_bytes_received": network.bytes_recv,

        "overall_health": overall_health,

        "alerts": alerts,

        **processes

    }
