"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { useState } from "react";

const Register: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);

  const { set: setToken } = useLocalStorage<string>("token", "");
  const { set: setUserId } = useLocalStorage<string>("userId", "");
  const { set: setStoredUsername } = useLocalStorage<string>("username", "");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiService.post<User>("/users/register", { username, password, bio });

      if (response.token) setToken(response.token);
      if (response.id) setUserId(response.id);
      if (response.username) setStoredUsername(response.username);
      else if (username) setStoredUsername(username);

      router.push("/dashboard");
    } catch (error) {
      if (error instanceof Error) {
        alert(`Something went wrong during the registration:\n${error.message}`);
      } else {
        console.error("An unknown error occurred during registration.");
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

        <h2 className="text-center text-gray-900 text-xl font-bold mb-2">Create an account</h2>
        <p className="text-center text-gray-500 text-sm mb-6">Fill in the details below to get started.</p>

        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-1.5" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white outline-none transition focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 placeholder:text-gray-400"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white outline-none transition focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 placeholder:text-gray-400"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-1.5" htmlFor="bio">
              Biography <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <input
              id="bio"
              type="text"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white outline-none transition focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 placeholder:text-gray-400"
              placeholder="Enter biography"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-500 text-white border-none rounded-lg text-[15px] font-semibold cursor-pointer transition hover:bg-blue-600 disabled:opacity-65 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Registering…" : "Register"}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            type="button"
            className="text-blue-500 text-sm font-medium bg-none border-none cursor-pointer p-0 hover:underline"
            onClick={() => router.push("/login")}
          >
            Already have an account? Log in
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;