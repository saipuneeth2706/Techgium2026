import logging
import time
import json
import os
import cv2
import numpy as np
from datetime import datetime
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

import google.generativeai as genai
from dotenv import load_dotenv
import PIL.Image

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

# Configure Gemini
GENAI_KEY = os.getenv("GEMINI_API_KEY")
if GENAI_KEY:
    masked_key = GENAI_KEY[:4] + "*" * (len(GENAI_KEY) - 8) + GENAI_KEY[-4:] if len(GENAI_KEY) > 8 else "****"
    logger.info(f"🔑 Gemini API Key loaded: {masked_key}")
    genai.configure(api_key=GENAI_KEY)
else:
    logger.warning("⚠️ No GEMINI_API_KEY found. AI features will be disabled.")

class VisionOneAgent:
    def __init__(self, headless=False):
        self.headless = headless
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
        Self-Healing 'Find & Click' Mechanism.
        Attempts to click selector. If fails, searches by text description.
        """
        logger.info(f"Attempting to click: {description} ({selector})")
        try:
            self.page.wait_for_selector(selector, timeout=2000)
            self.page.click(selector)
            logger.info(f"✅ Clicked element: {selector}")
            self._log_event("Smart Click", "Success", f"Clicked {selector}")
            self.report_data["tests_run"] += 1
            self.report_data["passes"] += 1
        except PlaywrightTimeoutError:
            logger.warning(f"⚠️ Selector '{selector}' failed. Attempting AI Self-Healing...")
            screenshot_path = self._take_screenshot(f"fail_{description.replace(' ', '_')}")
            screenshot_filename = os.path.basename(screenshot_path) if screenshot_path else ""
            
            # 1. Ask Gemini for help
            ai_suggestion = self._ask_gemini(
                f"I am trying to click a button described as '{description}' but the selector '{selector}' failed. "
                "Look at this screenshot. Is the button visible? If yes, what is the exact text on it? "
                "Reply ONLY with the exact text I should search for. If not found, say 'NOT_FOUND'.", 
                screenshot_path
            )

            # Heuristic Strategy (Modified by AI)
            search_text = description
            if ai_suggestion and "NOT_FOUND" not in ai_suggestion:
                search_text = ai_suggestion.replace('"', '').strip() # Clean quotes
                logger.info(f"✨ AI suggests searching for text: '{search_text}'")

            # 2. Heuristic Fallback: Search by text (Original + AI Enhanced)
            try:
                # Try finding button by exact text or partial text
                element = self.page.get_by_text(search_text, exact=False).first
                if not element.is_visible():
                     # Try searching specifically for buttons with that name
                     element = self.page.get_by_role("button", name=search_text).first
                
                if element.is_visible():
                    element.click()
                    logger.info(f"✅ Self-Healed: Clicked element based on text match: '{search_text}'")
                    self.report_data["healed_count"] += 1
                    self.report_data["tests_run"] += 1
                    self.report_data["passes"] += 1
                    self._log_event("Smart Click", "Healed", f"Clicked via text: {search_text}. Screenshot: {screenshot_filename}")
                else:
                     raise Exception("Heuristic fallback failed: Element not found by text.")

            except Exception as e:
                logger.error(f"❌ Smart Click Failed: Could not find '{description}' (AI tried: '{search_text}'). Error: {e}")
                self.report_data["failures"] += 1
                self.report_data["tests_run"] += 1
                self._log_event("Smart Click", "Fail", f"{str(e)}. Screenshot: {screenshot_filename}")
                self._take_screenshot(f"critical_fail_{description.replace(' ', '_')}")

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
        # Looking for the generic loader or specific lucide class
        if self.page.locator(".animate-spin").is_visible():
             logger.warning("⚠️ Buffering Detected (Spinner visible)")
             issues.append("Buffering")

        # 3. Black Screen Detection (OpenCV)
        if screenshot_path:
            is_black_screen, black_ratio = self._is_black_screen(screenshot_path)
            if is_black_screen:
                logger.error(f"🚩 CRITICAL: Black Screen Detected ({black_ratio:.1%} black pixels)")
                issues.append("Black_Screen")
            else:
                 logger.info(f"Visual check passed. Black pixel ratio: {black_ratio:.1%}")

        if issues:
            self._log_event("QoE Analysis", "Issues Found", f"{', '.join(issues)}. Screenshot: {os.path.basename(screenshot_path)}")
            self.report_data["failures"] += 1 # Count specific QoE checks as checks? Or just log issues.
        else:
            logger.info("✅ QoE Analysis Passed: No anomalies detected.")
            self._log_event("QoE Analysis", "Pass", f"Screenshot: {os.path.basename(screenshot_path)}")
            self.report_data["passes"] += 1
        
        self.report_data["tests_run"] += 1

    def trigger_chaos(self, mode):
        """
        Triggers a specific chaos mode via the UI.
        Modes: 'Trigger Buffering', 'Trigger DRM Error', 'Audio Sync Issue', 'UI Crash'
        """
        logger.info(f"Injecting Chaos: {mode}")
        try:
             # 1. Open Chaos Menu (Assuming the red bug button)
             # We rely on visual attributes or a stable class since ID isn't explicitly 'chaos-toggle' in current code, 
             # but we can deduce it from the class 'bg-red-600 rounded-full'.
             # Better yet, let's use the icon detection or a specific selector if we knew it.
             # Based on previous code: button with <Bug> icon.
             
             menu_button = self.page.locator("button:has(svg.lucide-bug)")
             if not menu_button.is_visible():
                 logger.warning("Chaos menu button not found!")
                 return

             menu_button.click()
             time.sleep(0.5) # Animation

             # 2. Click the specific mode button text
             self.page.get_by_text(mode, exact=False).click()
             logger.info(f"✅ Triggered Chaos Mode: {mode}")
             self._log_event("Chaos Injection", "Success", mode)
             
             # Close menu to clear view if needed (clicking toggle again or outside)
             # menu_button.click() 

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
            # Count pixels that are effectively black (very low luminance, < 10)
            non_zero = cv2.countNonZero(gray)
            total_pixels = gray.size
            
            # Simple threshold: if pixel value < 10, consider it black
            # Better approach: countnonZero returns NON-black. 
            # So black pixels = total - non_zero (if we threshold first)
            
            # Threshold image to pure black/white: values < 10 become 0, else 255
            _, thresh = cv2.threshold(gray, 10, 255, cv2.THRESH_BINARY)
            non_black = cv2.countNonZero(thresh)
            black_ratio = 1 - (non_black / total_pixels)
            
            return black_ratio > threshold, black_ratio
        except Exception as e:
            logger.error(f"Image processing error: {e}")
            return False, 0.0

    def _ask_gemini(self, prompt, image_path):
        """
        Queries Gemini 1.5 Flash with text and image.
        Returns text response.
        """
        if not GENAI_KEY:
            return None

        try:
            logger.info("🧠 Asking Gemini...")
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            # Read image
            if not os.path.exists(image_path):
                return None
                
            # Uploading image effectively by passing bytes or path depending on SDK version.
            # standard PIL or path usually works. Let's use Pillow.
            import PIL.Image
            img = PIL.Image.open(image_path)
            
            response = model.generate_content([prompt, img])
            logger.info(f"🤖 Gemini says: {response.text.strip()}")
            return response.text.strip()
        except Exception as e:
            logger.error(f"❌ Gemini Error: {e}")
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

if __name__ == "__main__":
    # Main Execution Block
    agent = VisionOneAgent(headless=False)
    
    try:
        # 1. Start Session
        agent.start_session("http://localhost:5173")
        
        # 2. Login Flow (Self-Healing Test)
        # Fill Dummy Credentials (just in case validation is added later)
        agent.page.fill("input[type='email']", "qa@hackflix.com")
        agent.page.fill("input[type='password']", "chaos_mode_123")
        
        # Intentionally using a broken selector to test healing
        # There is no ID #msg-btn-login in the real app, so this should trigger healing searching for "Sign In"
        agent.smart_click("#msg-btn-login", "Sign In") 
        
        # Wait for navigation
        agent.page.wait_for_url("**/browse", timeout=5000)
        
        # 3. Play Video
        # Click the 'Play' button on the Hero Banner
        agent.smart_click("button:has-text('Play')", "Play")
        agent.page.wait_for_url("**/watch/*", timeout=5000)
        time.sleep(3) # Watch for a bit
        
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
        
        # 7. Chaos Test: Black Screen (Simulated by UI Crash or just checking logic)
        # Note: UI Crash hides button, doesn't cause black screen. 
        # But we can run the analysis anyway.
        agent.trigger_chaos("UI Crash")
        time.sleep(1)
        agent.analyze_video_stream()
        
    except Exception as e:
        logger.error(f"Global Execution Error: {e}")
    finally:
        agent.stop_session()
