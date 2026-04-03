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

      router.push("/users");
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
    <div className={styles.background}>
      <div className={styles.card}>
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

        <h2 className={styles.title}>Create your account</h2>
        <p className={styles.subtitle}>Join TripSync! Please enter your details.</p>

        {errorMsg && <p className={styles.error}>{errorMsg}</p>}

        <form onSubmit={handleRegister}>
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
              autoComplete="new-password"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="bio">
              Biography
            </label>
            <input
              id="bio"
              type="text"
              className={styles.input}
              placeholder="Enter your biography"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className={styles.registerBtn}
            disabled={loading}
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <div className={styles.loginRow}>
          <button
            type="button"
            className={styles.loginBtn}
            onClick={() => router.push("/login")}
          >
            Already have an account? Log in!
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
