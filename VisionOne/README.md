# VisionOne Agent 👁️

**VisionOne** is an AI-driven Autonomous QA Agent designed to test the HackFlix OTT platform. It combines browser automation (Playwright) with computer vision (OpenCV) to detect visual anomalies that traditional code-based tests miss.

## 🚀 Features

### 1. Self-Healing "Smart Click"

Traditional automation breaks when selectors change. VisionOne leverages a self-healing mechanism:

- **Primary Strategy**: Attempts to click using the defined CSS selector.
- **Healing Event**: If the selector fails (Timeout), it captures a screenshot of the failure.
- **Fallback Strategy**: It heuristically scans the page for elements matching the _text description_ (e.g., "Sign In") or ARIA roles and clicks them.
- **Result**: The test continues, and the healing event is logged for review.

### 2. Visual QoE Analysis (Quality of Experience)

Goes beyond DOM checking to analyze the actual video stream:

- **Black Screen Detection**: Uses OpenCV to calculate the percentage of black pixels in the video player. Flags "CRITICAL" if >95% detected.
- **Buffering Detection**: Visually identifies spinner/loader elements that indicate network stall.
- **DRM Error Detection**: Scans rendered text for specific error codes (e.g., "Error 5001").

### 3. Chaos Engineering Integration

VisionOne is aware of HackFlix's "Chaos Mode". It can proactively trigger failures to verify error handling:

- Triggers **Buffering** -> Verifies Loader is visible.
- Triggers **DRM Error** -> Verifies Error Message.
- Triggers **UI Crash** -> Verifies broken state.

## 🛠️ Setup & Installation

### Prerequisites

- Python 3.8+
- Node.js (for Playwright browsers)

### Installation

1.  Navigate to the directory:
    ```bash
    cd VisionOne
    ```
2.  Create and Activate Virtual Environment:
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```
3.  Install Dependencies:
    ```bash
    pip install playwright opencv-python numpy
    playwright install chromium
    ```

## ▶️ Usage

1.  **Start HackFlix**: Ensure the web application is running.

    ```bash
    # In project root
    cd hackflix
    npm run dev
    ```

2.  **Run the Agent**:
    ```bash
    # In VisionOne directory (with .venv active)
    python vision_agent.py
    ```

## 📊 Reporting

After execution, reports are saved in the `reports/` directory:

- **JSON Summary**: `reports/summary_<timestamp>.json` (Contains Pass/Fail counts, Healed events).
- **Screenshots**:
  - `fail_<test_name>.png`: Captured when a selector fails (before healing).
  - `qoe_analysis_<timestamp>.png`: Captured during video quality analysis.

## 🧠 Configuration

You can customize the agent in `vision_agent.py`:

- `headless=False` (Default): set to `True` for CI/CD environments.
- `threshold=0.95`: Adjust the black screen sensitivity in `_is_black_screen`.
