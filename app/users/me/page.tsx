"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiService } from "@/api/apiService";

interface UserProfile {
  id: number;
  username: string;
}

const AccountSettings: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleClose = () => {
    router.replace("/dashboard");
  };

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const readLocal = (k: string) => {
          const raw = localStorage.getItem(k);
          if (!raw) return null;
          try {
            return JSON.parse(raw);
          } catch {
            return raw;
          }
        };

        const storedUserId = readLocal("userId");
        const storedToken = readLocal("token");
        const storedUsername = readLocal("username");

        if (!storedUserId || !storedToken || !storedUsername) {
          setError("User not logged in. Please log in first.");
          setLoading(false);
          return;
        }

        const userId = parseInt(storedUserId, 10);
        const apiService = new ApiService(storedToken);

        // Fetch current user profile from API
        try {
          const userProfile = await apiService.getCurrentUser(userId);
          setUser(userProfile);
        } catch {
          // Fallback to localStorage if API fails
          setUser({
            id: userId,
            username: storedUsername,
          });
        }
      } catch (err) {
        setError("Failed to load user profile.");
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  const validatePassword = (): boolean => {
    if (!currentPassword) {
      setPasswordError("Current password is required.");
      return false;
    }
    if (!newPassword) {
      setPasswordError("New password is required.");
      return false;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return false;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    if (!validatePassword()) {
      return;
    }

    setPasswordSubmitting(true);
    try {
      const readLocal = (k: string) => {
        const raw = localStorage.getItem(k);
        if (!raw) return null;
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      };

      const token = readLocal("token");
      if (!token) {
        setPasswordError("No authentication token found.");
        return;
      }

      const apiService = new ApiService(token);
      const result = await apiService.updatePassword(currentPassword, newPassword);

      // If new token is provided, update it in localStorage
      if (result.token) {
        localStorage.setItem("token", JSON.stringify(result.token));
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMessage("Password updated successfully!");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPasswordError(err.message || "Failed to update password.");
      } else {
        setPasswordError("Failed to update password.");
      }
    } finally {
      setPasswordSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-app-dark flex items-center justify-center p-6">
        <div className="rounded-2xl bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <p className="text-lg text-gray-900">Loading account settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-app-dark flex items-center justify-center p-6">
        <div className="rounded-2xl bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <p className="text-lg text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-dark flex items-center justify-center p-6">
      <div className="rounded-2xl bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)] w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h1>

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}

        {user && (
          <div className="mb-8 p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700 mb-2">
              <strong>User ID:</strong> {user.id}
            </p>
            <p className="text-sm text-gray-700 mb-2">
              <strong>Current Username:</strong> {user.username}
            </p>
          </div>
        )}

        <div className="space-y-8">
          {/* Change Password Section */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  disabled={passwordSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 8 characters)"
                  disabled={passwordSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={passwordSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent disabled:bg-gray-100"
                />
                {passwordError && <p className="mt-1 text-sm text-red-600">{passwordError}</p>}
              </div>
              <button
                type="submit"
                disabled={passwordSubmitting || !currentPassword || !newPassword || !confirmPassword}
                className="w-full px-4 py-2 bg-[#1E88E5] text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {passwordSubmitting ? "Updating..." : "Update Password"}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className={
                  successMessage
                    ? "w-full px-4 py-2 bg-[#1E88E5] text-white font-semibold rounded-md hover:bg-blue-700 transition"
                    : "w-full px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-50 transition"
                }
              >
                Close
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
