"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import styles from "./login.module.css";

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

      // Redirect to the dashboard on success
      router.push("/users");
    } catch (err) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.background}>
      <div className={styles.card}>

        {/* TripSync Logo */}
        <div className={styles.logoContainer}>
          <Image
            src="/logos/Logo.jpeg"
            alt="TripSync"
            width={180}
            height={50}
            style={{ objectFit: "contain" }}
            priority
          />
        </div>

        <h2 className={styles.title}>Log in to your account</h2>
        <p className={styles.subtitle}>Welcome back! Please enter your details.</p>

        {/* Inline error feedback */}
        {errorMsg && <p className={styles.error}>{errorMsg}</p>}

        <form onSubmit={handleLogin}>

          {/* Username */}
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              className={styles.input}
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className={styles.input}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {/* Remember + Forgot password */}
          <div className={styles.rememberRow}>
            <label className={styles.rememberLabel}>
              <input type="checkbox" className={styles.checkbox} />
              Remember for 30 days
            </label>
            <button type="button" className={styles.forgotBtn}>
              Forgot password
            </button>
          </div>

          {/* Login button */}
          <button
            type="submit"
            className={styles.loginBtn}
            disabled={loading}
          >
            {loading ? "Logging in…" : "Login"}
          </button>
        </form>

        {/* Sign Up link */}
        <div className={styles.signupRow}>
          <button
            type="button"
            className={styles.signupBtn}
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
