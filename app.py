
import logging
import time

from flask import Flask, jsonify, render_template

from monitoring.metrics import collect_metrics


# --------------------------------------------------
# 1. FLASK APPLICATION
# --------------------------------------------------

app = Flask(__name__)


# --------------------------------------------------
# 2. APPLICATION LOGGING
# --------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)

logger = logging.getLogger(__name__)


# --------------------------------------------------
# 3. DASHBOARD ROUTE
# --------------------------------------------------

@app.route("/")
def home():

    return render_template("index.html")


# --------------------------------------------------
# 4. METRICS API
# --------------------------------------------------

@app.route("/metrics")
def metrics():

    try:

        data = collect_metrics()

        data["timestamp"] = int(time.time())

        logger.info(
            "Metrics collected successfully for %s",
            data["hostname"]
        )

        return jsonify(data), 200

    except Exception:

        logger.exception(
            "Failed to collect server metrics"
        )

        return jsonify({
            "error": "Unable to collect server metrics"
        }), 500


# --------------------------------------------------
# 5. APPLICATION HEALTH CHECK
# --------------------------------------------------

@app.route("/health")
def health():

    return jsonify({

        "status": "healthy",

        "application": "Server Monitoring Application",

        "timestamp": int(time.time())

    }), 200


# --------------------------------------------------
# 6. START APPLICATION
# --------------------------------------------------

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False
    )
