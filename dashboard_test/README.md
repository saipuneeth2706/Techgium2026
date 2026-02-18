# VisionOne Dashboard 📊

This is a real-time monitoring dashboard for the **VisionOne AI QA Agent**. It visualizes test results, visual quality of experience (QoE) analysis, and self-healing events.

## 🚀 Getting Started

To run the dashboard, execute the start script from the `dashboard_test` directory:

```bash
cd dashboard_test
./run_dashboard.sh
```

This will automatically:
1.  Start the **FastAPI Backend** (port 8080) to serve JSON reports from `VisionOne/reports`.
2.  Start the **React/Vite Frontend** (port 5173).

## 🛠️ Features

- **Live Polling**: Automatically refreshes every 5 seconds to show results of new test runs.
- **Run History**: Navigate through previous test sessions.
- **Intelligence Log**: View detailed logs of "Smart Click" healing and visual analysis events.
- **Summary Metrics**: High-level pass/fail/healed stats at a glance.

## 🏗️ Architecture

- **Backend**: FastAPI (Python) - Serves the generated JSON reports and screenshots.
- **Frontend**: React (Vite) + TailwindCSS - Professional, dark-themed UI matching the OTT aesthetic.
- **Icons**: Lucide-React.
