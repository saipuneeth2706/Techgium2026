import logging
import time
import json
import os
import cv2
import numpy as np
import base64
import subprocess
import socket
import re
from datetime import datetime
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

import ollama
from dotenv import load_dotenv

# Load Environment Variables
load_dotenv()

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("VisionOneAgent")

class VisionOneAgent:
    def __init__(self, headless=False, model="llama3.2-vision"):
        self.headless = headless
        self.ai_model = model
        self.browser = None
        self.page = None
        self.playwright = None
        self.report_data = {
            "timestamp": datetime.now().isoformat(),
            "status": "Running",
            "tests_run": 0,
            "passes": 0,
            "failures": 0,
            "healed_count": 0,
            "events": []
        }
        self.reports_dir = "reports"
        os.makedirs(self.reports_dir, exist_ok=True)
        
        # Ensure Ollama server is running locally
        self._ensure_ollama_running()
        
        # We don't need API keys for Ollama as it runs locally on localhost:11434
        logger.info(f"🤖 VisionOne initialized with LOCAL model: {self.ai_model}")

    def start_session(self, url="http://localhost:5173"):
        """Initialize Playwright and launch browser."""
        logger.info(f"Starting VisionOne Session. Target: {url}")
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(headless=self.headless)
        self.context = self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            record_video_dir=f"{self.reports_dir}/videos"
        )
        self.page = self.context.new_page()
        
        try:
            self.page.goto(url)
            logger.info("✅ Browser launched and navigated to target.")
            self._log_event("Session Started", "Success")
        except Exception as e:
            logger.error(f"❌ Failed to reach target: {e}")
            self._log_event("Session Start", "Failed", str(e))
            self.stop_session()
            raise # Re-raise to prevent further execution if session fails

    def stop_session(self):
        """Cleanup resources."""
        # Capture video path before closing context
        try:
            if self.page and self.page.video:
                video_full_path = self.page.video.path()
                self.report_data["video_filename"] = os.path.basename(video_full_path)
                self._log_event("Video Capture", "Success", f"Session recording saved: {self.report_data['video_filename']}")
        except Exception as e:
            logger.error(f"Could not capture video path: {e}")

        if self.context:
            self.context.close()
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
        
        # Save Report
        report_path = f"{self.reports_dir}/summary_{int(time.time())}.json"
        with open(report_path, "w") as f:
            json.dump(self.report_data, f, indent=2)
        logger.info(f"Session ended. Report saved to {report_path}")

    def smart_click(self, selector, description):
        """
        Self-Healing 'Find & Click' Mechanism using Local Ollama Vision.
        """
        logger.info(f"Attempting to click: {description} ({selector})")
        try:
            # Short timeout for the primary selector
            self.page.wait_for_selector(selector, timeout=2000)
            self.page.click(selector)
            logger.info(f"✅ Clicked element: {selector}")
            self._log_event("Smart Click", "Success", f"Clicked {selector}")
            self.report_data["tests_run"] += 1
            self.report_data["passes"] += 1
        except Exception:
            logger.warning(f"⚠️ Selector '{selector}' failed. Attempting AI Self-Healing with LOCAL OLLAMA...")
            screenshot_path = self._take_screenshot(f"fail_{description.replace(' ', '_')}")
            screenshot_filename = os.path.basename(screenshot_path) if screenshot_path else ""
            
            # 1. Ask LOCAL AI for help
            ai_suggestion = self._ask_ai(
                f"I am trying to click a button described as '{description}' but the selector '{selector}' failed. "
                "Look at this screenshot. Is the button visible? If yes, what is the exact text on it? "
                "Reply ONLY with the exact text I should search for, no punctuation at the end. If not found, say 'NOT_FOUND'.", 
                screenshot_path
            )

            # Heuristic Strategy (Modified by AI or Fallback)
            search_text = description
            if ai_suggestion and "NOT_FOUND" not in ai_suggestion:
                logger.debug(f"Raw AI suggestion: '{ai_suggestion}'")
                # Clean AI suggestions from punctuation that often breaks locators
                search_text = re.sub(r'["\']', '', ai_suggestion).strip()
                search_text = re.sub(r'[.,;!]$', '', search_text) 
                logger.info(f"✨ Local AI suggests searching for text: '{search_text}'")
            else:
                logger.warning("🤖 Local AI suggestion unavailable or not found. Falling back to description text.")

            # 2. Heuristic Fallback
            try:
                # Try finding by role first (more robust)
                element = self.page.get_by_role("button", name=search_text, exact=False).first
                
                # If not found or not visible, try by text
                if element.count() == 0:
                     logger.info(f"Role 'button' with name '{search_text}' not found. Trying direct text match...")
                     element = self.page.get_by_text(search_text, exact=False).first
                
                # Check for existence before action
                if element.count() > 0:
                    # Scroll and try to click
                    element.scroll_into_view_if_needed()
                    element.click(force=True) # Use force=True to bypass potential overlay issues if AI is confident
                    logger.info(f"✅ Self-Healed: Clicked element based on text match: '{search_text}'")
                    self.report_data["healed_count"] += 1
                    self.report_data["tests_run"] += 1
                    self.report_data["passes"] += 1
                    self._log_event("Smart Click", "Healed", f"Clicked via text: {search_text}. Screenshot: {screenshot_filename}")
                else:
                     raise Exception(f"Element '{search_text}' not found via role or text.")

            except Exception as e:
                logger.error(f"❌ Smart Click Failed: Could not find '{description}'. Error: {e}")
                self.report_data["failures"] += 1
                self.report_data["tests_run"] += 1
                self._log_event("Smart Click", "Fail", f"{str(e)}. Screenshot: {screenshot_filename}")

    def analyze_video_stream(self):
        """
        Visual Quality of Experience (QoE) Analysis.
        Detects DRM errors, Buffering, and Black Screens.
        """
        logger.info("Analyzing Video Stream Quality...")
        time.sleep(1) # Wait for potential frame updates
        screenshot_path = self._take_screenshot("qoe_analysis")
        
        issues = []
        
        # 1. Crash Detection (Text based)
        page_content = self.page.content()
        if "DRM_LICENSE_INVALID" in page_content or "Error 5001" in page_content:
            logger.error("🚩 CRITICAL: DRM Error Detected")
            issues.append("DRM_Error")
        
        # 2. Buffering Detection (DOM based)
        if self.page.locator(".animate-spin").is_visible():
             logger.warning("⚠️ Buffering Detected (Spinner visible)")
             issues.append("Buffering")

        # 3. Black Screen Detection (OpenCV)
        if screenshot_path:
            is_black_screen, black_ratio = self._is_black_screen(screenshot_path)
            if is_black_screen:
                # If it's a DRM error, a black screen is expected/part of the error UI
                if "DRM_Error" in issues:
                    logger.info("Black screen detected but ignored as it is part of the DRM Error UI.")
                else:
                    logger.error(f"🚩 CRITICAL: Black Screen Detected ({black_ratio:.1%} black pixels)")
                    issues.append("Black_Screen")
            else:
                 logger.info(f"Visual check passed. Black pixel ratio: {black_ratio:.1%}")

        if issues:
            self._log_event("QoE Analysis", "Issues Found", f"{', '.join(issues)}. Screenshot: {os.path.basename(screenshot_path)}")
            self.report_data["failures"] += 1
        else:
            logger.info("✅ QoE Analysis Passed: No anomalies detected.")
            self._log_event("QoE Analysis", "Pass", f"Screenshot: {os.path.basename(screenshot_path)}")
            self.report_data["passes"] += 1
        
        self.report_data["tests_run"] += 1

    def trigger_chaos(self, mode):
        """
        Triggers a specific chaos mode via the UI.
        """
        logger.info(f"Injecting Chaos: {mode}")
        try:
             # Ensure menu is open - use force=True in case overlays are present
             menu_button = self.page.locator("button:has(svg.lucide-bug)")
             menu_content = self.page.locator("h3:has-text('Chaos Mode')")
             
             if not menu_content.is_visible():
                 menu_button.click(force=True)
                 self.page.wait_for_selector("h3:has-text('Chaos Mode')", timeout=5000)

             # Click the specific mode button
             self.page.get_by_text(mode, exact=False).click(force=True)
             logger.info(f"✅ Triggered Chaos Mode: {mode}")
             self._log_event("Chaos Injection", "Success", mode)
             
             # Close the menu
             menu_button.click(force=True)
             time.sleep(0.5)

        except Exception as e:
            logger.error(f"❌ Failed to trigger chaos: {e}")
            self._log_event("Chaos Injection", "Fail", str(e))

    def _is_black_screen(self, image_path, threshold=0.95):
        """
        Returns True if the image is mostly black.
        """
        try:
            img = cv2.imread(image_path)
            if img is None:
                return False, 0.0
            
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            # Threshold image to pure black/white: values < 10 become 0, else 255
            _, thresh = cv2.threshold(gray, 10, 255, cv2.THRESH_BINARY)
            non_black = cv2.countNonZero(thresh)
            black_ratio = 1 - (non_black / gray.size)
            
            return black_ratio > threshold, black_ratio
        except Exception as e:
            logger.error(f"Image processing error: {e}")
            return False, 0.0

    def _ask_ai(self, prompt, image_path):
        """
        Queries Local Ollama with text and image.
        Returns text response.
        """
        try:
            logger.info(f"🧠 Asking Local Ollama ({self.ai_model})...")
            
            if not os.path.exists(image_path):
                return None
            
            with open(image_path, 'rb') as img_file:
                img_data = img_file.read()
            
            response = ollama.generate(
                model=self.ai_model,
                prompt=prompt,
                images=[img_data]
            )
            
            ai_text = response['response'].strip()
            logger.info(f"🤖 Local AI says: {ai_text}")
            return ai_text
        except Exception as e:
            logger.error(f"❌ Local Ollama Error: {e}. Ensure 'ollama serve' is running!")
            return None

    def _take_screenshot(self, name):
        """Captures and saves a screenshot."""
        filename = f"{name}_{int(time.time())}.png"
        path = f"{self.reports_dir}/{filename}"
        try:
            self.page.screenshot(path=path)
            return path
        except:
            return None

    def _log_event(self, type, status, details=""):
        self.report_data["events"].append({
            "timestamp": datetime.now().isoformat(),
            "type": type,
            "status": status,
            "details": details
        })

    def _ensure_ollama_running(self):
        """Checks if Ollama server is running, and starts it if not."""
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex(('127.0.0.1', 11434))
        sock.close()

        if result == 0:
            logger.info("✅ Ollama server is already running.")
        else:
            logger.info("🚀 Starting Ollama server in background...")
            try:
                # Start ollama serve as a detached process
                subprocess.Popen(
                    ["ollama", "serve"],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    start_new_session=True
                )
                
                # Wait for server to start (up to 30 seconds)
                for i in range(30):
                    time.sleep(1)
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(1)
                    if sock.connect_ex(('127.0.0.1', 11434)) == 0:
                        sock.close()
                        logger.info("✅ Ollama server started successfully.")
                        return
                    sock.close()
                
                logger.error("❌ Failed to start Ollama server after 30 seconds.")
            except Exception as e:
                logger.error(f"❌ Error starting Ollama: {e}")

if __name__ == "__main__":
    # Main Execution Block
    # Using Llama 3.2 Vision (Local via Ollama)
    agent = VisionOneAgent(headless=False, model="llama3.2-vision")
    
    try:
        # 1. Start Session
        agent.start_session("http://localhost:5173")
        
        # 2. Login Flow (Self-Healing Test)
        agent.page.fill("input[type='email']", "qa@hackflix.com")
        agent.page.fill("input[type='password']", "chaos_mode_123")
        
        # Intentionally using a broken selector to test healing
        agent.smart_click("#msg-btn-login", "Sign In") 
        
        # Increase timeout to 10s for slower environments
        agent.page.wait_for_url("**/browse", timeout=10000)
        
        # 3. Play Video
        agent.smart_click("button:has-text('Play')", "Play")
        agent.page.wait_for_url("**/watch/*", timeout=5000)
        time.sleep(6) # Increased wait to allow video to start rendering
        
        # 4. Analyze Normal Stream
        agent.analyze_video_stream()
        
        # 5. Chaos Test: Buffer
        agent.trigger_chaos("Trigger Buffering")
        time.sleep(2)
        agent.analyze_video_stream() # Should detect buffering
        agent.trigger_chaos("Stop Buffering") # Toggle off
        
        # 6. Chaos Test: DRM Error
        agent.trigger_chaos("Trigger DRM Error")
        time.sleep(2)
        agent.analyze_video_stream() # Should detect DRM text
        
        # Reload to recover from DRM
        agent.page.reload()
        time.sleep(2)
        
        # 7. Chaos Test: Black Screen
        agent.trigger_chaos("UI Crash")
        time.sleep(1)
        agent.analyze_video_stream()
        
    except Exception as e:
        logger.error(f"Global Execution Error: {e}")
    finally:
        agent.stop_session()
