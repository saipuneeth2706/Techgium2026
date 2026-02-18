import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    // Logic: Allow login with any credentials
    navigate("/browse");
  };

  return (
    <div className="relative min-h-screen w-full bg-black bg-opacity-50">
      {/* Background Image */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center opacity-60"
        style={{
          backgroundImage:
            "url('https://assets.nflxext.com/ffe/siteui/vlv3/f841d4c7-10e1-40af-bcae-07a3f8dc141a/f6d7434e-d6de-4185-a6d4-c77a2d08737b/US-en-20220502-popsignuptwoweeks-perspective_alpha_website_medium.jpg')",
        }}
      ></div>

      <div className="absolute inset-0 -z-10 bg-black/50"></div>

      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-[450px] bg-black/75 p-16 rounded-lg text-white">
          <h1 className="text-3xl font-bold mb-8">Sign In</h1>

          <form onSubmit={handleLogin} className="flex flex-col space-y-4">
            <input
              type="email"
              placeholder="Email or phone number"
              className="px-5 py-3 rounded bg-[#333] text-white placeholder-gray-500 focus:outline-none focus:bg-[#454545]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="px-5 py-3 rounded bg-[#333] text-white placeholder-gray-500 focus:outline-none focus:bg-[#454545]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-6 py-3 font-bold text-lg"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-4 flex justify-between text-sm text-[#b3b3b3]">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="mr-1 accent-[#737373]"
              />
              <label htmlFor="remember">Remember me</label>
            </div>
            <a href="#" className="hover:underline">
              Need help?
            </a>
          </div>

          <div className="mt-16 text-[#737373]">
            New to HackFlix?{" "}
            <span className="text-white hover:underline cursor-pointer">
              Sign up now
            </span>
            .
          </div>
          <div className="mt-4 text-[13px] text-[#8c8c8c]">
            This page is protected by Google reCAPTCHA to ensure you're not a
            bot.
          </div>
        </div>
      </div>
    </div>
  );
}
