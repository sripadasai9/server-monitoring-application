
# Server Monitoring Platform

A Python-based server monitoring application that collects and displays
real-time Linux server performance metrics through a web dashboard.

## Project Overview

The Server Monitoring Platform monitors the health and performance
of an Ubuntu EC2 instance.

It collects system metrics using Python and psutil and displays
them through a Flask-based web application.

## Features

- CPU utilization monitoring
- Memory utilization monitoring
- Disk utilization monitoring
- Network upload and download statistics
- Historical performance charts
- Top 5 CPU-consuming processes
- Top 5 memory-consuming processes
- Healthy, Warning and Critical status
- Resource threshold alerts
- Application health endpoint
- Application logging and error handling
- Responsive web dashboard

## Technology Stack

| Technology | Purpose |
|---|---|
| Python | Application development |
| Flask | Web framework and REST API |
| psutil | System resource monitoring |
| HTML | Dashboard structure |
| CSS | Dashboard styling |
| JavaScript | Live metrics and charts |
| Linux Ubuntu | Server operating system |
| AWS EC2 | Application hosting |
| Git | Version control |
| GitHub | Source code management |
| Docker | Planned containerization |

## Architecture

```text
             User Browser
                  |
                  |
           Flask Web Server
                  |
          -----------------
          |               |
       Dashboard       REST API
       HTML/CSS/JS      /metrics
                          |
                    Monitoring Module
                          |
                        psutil
                          |
                    Ubuntu EC2
                          |
                 CPU / RAM / Disk
                 Network / Processes
```

## Project Structure

```text
servermonitoring/
|
|-- app.py
|
|-- monitoring/
|   |-- __init__.py
|   |-- metrics.py
|
|-- templates/
|   |-- index.html
|
|-- static/
|   |-- css/
|   |   |-- style.css
|   |
|   |-- js/
|       |-- dashboard.js
|
|-- requirements.txt
|-- .gitignore
|-- README.md
```

## Installation

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd server-monitoring-application
```

### 2. Create a virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Start the application

```bash
python app.py
```

### 5. Access the application

Open:

```text
http://YOUR_SERVER_PUBLIC_IP:5000
```

## API Endpoints

| Endpoint | Description |
|---|---|
| `/` | Monitoring dashboard |
| `/metrics` | Server performance metrics |
| `/health` | Application health check |

## Monitoring Thresholds

| Resource utilization | Status |
|---|---|
| Below 80% | Healthy |
| 80% to below 90% | Warning |
| 90% or above | Critical |

These thresholds are configurable application defaults.

## Future Enhancements

- Docker containerization
- Persistent historical metric storage
- Prometheus and Grafana integration
- Email notifications
- Multiple server monitoring
- Automated deployment using CI/CD

## Author

Server Monitoring Platform - DevOps Learning Project.
