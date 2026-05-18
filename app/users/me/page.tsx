"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";

interface UserProfile {
  id: number;
  username: string;
}

const AccountSettings: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();

  const { value: token, set: setToken, clear: clearToken, hasRehydrated: tokenReady } = useLocalStorage<string>("token", "");
  const { value: userId, clear: clearUserId } = useLocalStorage<string>("userId", "");
  const { value: storedUsername, clear: clearUsername } = useLocalStorage<string>("username", "");
  const { value: sidebarCollapsed, set: setSidebarCollapsed } = useLocalStorage<boolean>("sidebarCollapsed", false);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleLogout = () => {
    clearToken();
    clearUserId();
    clearUsername();
    router.push("/login");
  };

  useEffect(() => {
    if (!tokenReady) {
      return;
    }

    if (!token) {
      router.push("/login");
      return;
    }

    if (!userId) {
      setError("User profile could not be loaded. Please log in again.");
      setLoading(false);
      return;
    }

    const loadUserProfile = async () => {
      try {
        setError(null);
        setLoading(true);
        const parsedUserId = Number.parseInt(userId, 10);

        if (Number.isNaN(parsedUserId)) {
          setError("User profile could not be loaded. Please log in again.");
          return;
        }

        try {
          const userProfile = await apiService.getCurrentUser(parsedUserId);
          setUser(userProfile);
        } catch {
          setUser({
            id: parsedUserId,
            username: storedUsername || "User",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [apiService, router, storedUsername, token, tokenReady, userId]);

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
      const result = await apiService.updatePassword(currentPassword, newPassword);

      if (result.token) {
        setToken(result.token);
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(null);
      setSuccessMessage("Password updated successfully.");
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

  if (!tokenReady || !token) {
    return null;
  }

  return (
    <div className={`grid h-screen overflow-hidden bg-[#f7f7f7] text-[#111] ${sidebarCollapsed ? "grid-cols-[64px_1fr]" : "grid-cols-[270px_1fr]"}`}>
      <Sidebar onLogout={handleLogout} onCollapsedChange={setSidebarCollapsed} />

      <main className="h-screen overflow-y-auto px-14 pt-7 pb-14">
        <header className="mb-10 flex min-h-14 items-center justify-between">
          <div>
            <h1 className="m-0 text-[42px] font-bold leading-tight">Account Settings</h1>
            <p className="m-0 mt-2 text-lg text-[#666]">Manage your profile and sign-in details.</p>
          </div>
        </header>

        {loading ? (
          <p className="text-sm text-[#666]">Loading account settings...</p>
        ) : error ? (
          <section className="max-w-3xl rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </section>
        ) : (
          <div className="grid max-w-5xl gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="rounded-lg border border-gray-200 bg-white p-6">
              <p className="text-sm font-semibold uppercase text-gray-500">Profile</p>
              <div className="mt-5 flex items-center gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xl font-bold text-[#2684ff]">
                  {(user?.username || storedUsername || "U").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-gray-900">{user?.username || storedUsername || "User"}</p>
                  <p className="text-sm text-gray-500">User ID {user?.id ?? userId}</p>
                </div>
              </div>
            </aside>

            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="m-0 text-xl font-semibold text-gray-900">Change Password</h2>
                  <p className="m-0 mt-1 text-sm text-gray-500">Update the password you use to access TripSync.</p>
                </div>
              </div>

              {successMessage && (
                <p className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {successMessage}
                </p>
              )}

              {passwordError && (
                <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {passwordError}
                </p>
              )}

              <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    disabled={passwordSubmitting}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    disabled={passwordSubmitting}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    disabled={passwordSubmitting}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={passwordSubmitting || !currentPassword || !newPassword || !confirmPassword}
                    className="inline-flex min-w-36 justify-center rounded-md bg-[#2684ff] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#1f6fe0] disabled:cursor-not-allowed disabled:opacity-65"
                  >
                    {passwordSubmitting ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default AccountSettings;
