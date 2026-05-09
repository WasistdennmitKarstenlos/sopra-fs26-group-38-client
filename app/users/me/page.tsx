"use client";

import React, { useEffect, useState } from "react";

interface UserProfile {
  id: number;
  username: string;
  email?: string;
  createdAt?: string;
}

const AccountSettings: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load current user profile from localStorage
    const storedUserId = localStorage.getItem("userId");
    const storedUsername = localStorage.getItem("username");

    if (storedUserId && storedUsername) {
      setUser({
        id: parseInt(storedUserId, 10),
        username: storedUsername,
      });
    } else {
      setError("User not logged in. Please log in first.");
    }

    setLoading(false);
  }, []);

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

        {user && (
          <div className="mb-8">
            <p className="text-sm text-gray-700 mb-2">
              <strong>User ID:</strong> {user.id}
            </p>
            <p className="text-sm text-gray-700 mb-2">
              <strong>Current Username:</strong> {user.username}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Placeholder for Change Username Section */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Change Username
            </h2>
            <p className="text-sm text-gray-600">
              Username update form will be added here.
            </p>
          </div>

          {/* Placeholder for Change Password Section */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Change Password
            </h2>
            <p className="text-sm text-gray-600">
              Password update form will be added here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
