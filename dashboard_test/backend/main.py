
import os
import json
import glob
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Any

app = FastAPI()

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Relative path to the reports directory in VisionOne
REPORTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../VisionOne/reports"))

@app.get("/api/reports")
def get_reports():
    """Returns a list of all JSON reports sorted by timestamp."""
    files = glob.glob(os.path.join(REPORTS_DIR, "summary_*.json"))
    # Sort files by modification time (latest first)
    files.sort(key=os.path.getmtime, reverse=True)
    
    reports = []
    for file_path in files:
        try:
            with open(file_path, "r") as f:
                data = json.load(f)
                data["filename"] = os.path.basename(file_path)
                reports.append(data)
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            
    return reports

@app.get("/api/latest")
def get_latest_report():
    """Returns the most recent report."""
    files = glob.glob(os.path.join(REPORTS_DIR, "summary_*.json"))
    if not files:
        raise HTTPException(status_code=404, detail="No reports found")
    
    latest_file = max(files, key=os.path.getmtime)
    try:
        with open(latest_file, "r") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading report: {e}")

# Mount reports directory to serve screenshots/videos
if os.path.exists(REPORTS_DIR):
    # html=True is not needed here as we are serving assets, not an app
    app.mount("/reports", StaticFiles(directory=REPORTS_DIR), name="reports")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
