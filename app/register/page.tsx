"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import styles from "./register.module.css";

interface RegisterPayload {
  username: string;
  password: string;
  bio: string;
} 

const Register: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const { set: setToken } = useLocalStorage<string>("token", "");
  const { set: setUserId } = useLocalStorage<string>("userId", "");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const payload: RegisterPayload = {
      username,
      password,
      bio,
    };

    try {
      const response = await apiService.post<User>("/users/register", payload);

      if (response.token) setToken(response.token);
      if (response.id) setUserId(response.id);

      router.push("/trips");
    } catch (error) {
      if (error instanceof Error) {
        alert(`Something went wrong during the registration:\n${error.message}`);
      } else {
        setErrorMsg("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

return (
  <div className="min-h-screen bg-app-dark flex items-center justify-center px-4">
    <div className="w-full max-w-md rounded-2xl bg-white px-8 py-10 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:px-10">
      <div className="mb-6 flex justify-center">
        <Image
          src="/logos/Logo.jpeg"
          alt="TripSync"
          width={180}
          height={50}
          className="h-auto object-contain"
          priority
        />
      </div>

      <h2 className="text-center text-2xl font-bold text-gray-900">
        Create your account
      </h2>
      <p className="mt-2 mb-6 text-center text-sm text-gray-500">
        Join TripSync! Please enter your details.
      </p>

      {errorMsg && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {errorMsg}
        </p>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-gray-700"
            htmlFor="username"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </div>

        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-gray-700"
            htmlFor="password"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-gray-700"
            htmlFor="bio"
          >
            Biography
          </label>
          <input
            id="bio"
            type="text"
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            placeholder="Enter your biography"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-500 py-3 text-[15px] font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-65"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>

      <div className="mt-5 text-center">
        <button
          type="button"
          className="text-sm font-medium text-blue-500 transition hover:underline"
          onClick={() => router.push("/login")}
        >
          Already have an account? Log in!
        </button>
      </div>
    </div>
  </div>
);

export default Register;
