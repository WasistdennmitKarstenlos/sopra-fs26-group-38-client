"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";

const Login: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Persist the auth token so subsequent requests include the Bearer header
  const { set: setToken } = useLocalStorage<string>("token", "");
  // Persist the user ID for profile / trip pages
  const { set: setUserId } = useLocalStorage<string>("userId", "");
  // Persist username for UI (e.g. sidebar)
  const { set: setStoredUsername } = useLocalStorage<string>("username", "");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      // POST /auth/login — server validates credentials and returns user + token
      const response = await apiService.post<User>("/auth/login", {
        username,
        password,
      });

      if (response.token) setToken(response.token);
      if (response.id) setUserId(response.id);
      if (response.username) setStoredUsername(response.username);
      else if (username) setStoredUsername(username);

      // Navigate to trip overview on successful login
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof Error) {
        // Show inline error message for invalid credentials and backend errors
        setErrorMsg(error.message);
      } else {
        setErrorMsg("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: "url('/images/Background.jpg')" }}>
      <div className="bg-white rounded-2xl px-12 py-10 w-full max-w-md shadow-[0_20px_60px_rgba(0,0,0,0.35)]">

        {/* TripSync Logo */}
        <div className="flex justify-center mb-5">
          <Image
            src="/logo.png"
            alt="TripSync"
            width={180}
            height={50}
            style={{ objectFit: "contain" }}
            priority
          />
        </div>

        <h2 className="text-center text-gray-900 text-xl font-bold mb-2">Log in to your account</h2>
        <p className="text-center text-gray-500 text-sm mb-6">Welcome back! Please enter your details.</p>

        {/* Inline error feedback */}
        {errorMsg && (
          <p className="text-red-600 text-xs text-center bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">
            {errorMsg}
          </p>
        )}

        <form onSubmit={handleLogin}>

          {/* Username */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-1.5" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white outline-none transition focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 placeholder:text-gray-400"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white outline-none transition focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 placeholder:text-gray-400"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {/* Remember + Forgot password */}
          <div className="flex justify-between items-center mb-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 cursor-pointer accent-blue-500" />
              Remember for 30 days
            </label>
            <button type="button" className="text-blue-500 text-sm font-medium bg-none border-none cursor-pointer p-0 hover:underline">
              Forgot password
            </button>
          </div>

          {/* Login button */}
          <button
            type="submit"
            className="w-full py-3 bg-blue-500 text-white border-none rounded-lg text-[15px] font-semibold cursor-pointer mb-4 transition hover:bg-blue-600 disabled:opacity-65 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Logging in…" : "Login"}
          </button>
        </form>

        {/* Sign Up link */}
        <div className="text-center">
          <button
            type="button"
            className="text-blue-500 text-sm font-medium bg-none border-none cursor-pointer p-0 hover:underline"
            onClick={() => router.push("/register")}
          >
            No Account? Sign Up!
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;
