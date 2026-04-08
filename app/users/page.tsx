// Dashboard: shows a list of all registered users (authenticated route).
// Clicking a user row navigates to /users/[id].
"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";

const Dashboard: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [users, setUsers] = useState<User[] | null>(null);

  // Read the token to guard this page
  const {
    value: token,
    clear: clearToken,
  } = useLocalStorage<string>("token", "");

  // Clear the stored user ID on logout
  const { clear: clearUserId } = useLocalStorage<string>("userId", "");

  const handleLogout = async () => {
    try {
      // POST /auth/logout — server invalidates the token
      await apiService.post("/auth/logout");
    } catch (error) {
      // Log but don't block logout on a server error
      if (error instanceof Error) {
        console.error(`Logout request failed: ${error.message}`);
      }
    } finally {
      // Always clear local session data and redirect to login
      clearToken();
      clearUserId();
      router.push("/login");
    }
  };

  useEffect(() => {
    // Only fetch users if we have a valid token
    if (!token) {
      return;
    }

    const fetchUsers = async () => {
      try {
        const fetchedUsers: User[] = await apiService.get<User[]>("/users");
        setUsers(fetchedUsers);
      } catch (error) {
        if (error instanceof Error) {
          alert(`Something went wrong while fetching users:\n${error.message}`);
        } else {
          console.error("An unknown error occurred while fetching users.");
        }
      }
    };

    fetchUsers();
  }, [apiService, token, router]);
  // - apiService changes when token changes (memoized in useApi)
  // - token changes trigger a re-check of auth state
  // - router is stable but listed to satisfy exhaustive-deps

  // Guard: if no token, show an "access denied" message
  if (!token) {
    return (
      <div className="min-h-screen bg-app-dark flex items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)] text-center">
          <h2 className="text-2xl font-bold text-gray-900">This page is only accessible for logged-in users.</h2>
          <div className="mt-5">
            <button
              type="button"
              className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600"
              onClick={() => router.push("/login")}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-dark p-6 md:p-10">
      <div className="mx-auto w-full max-w-5xl rounded-2xl bg-white p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">All users</h1>

        {!users ? (
          <p className="mt-6 text-sm text-gray-500">Loading users...</p>
        ) : (
          <>
            <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Username</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Id</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {users.map((user) => (
                    <tr
                      key={user.id ?? `user-${user.username ?? "unknown"}`}
                      className="cursor-pointer transition hover:bg-blue-50"
                      onClick={() => user.id && router.push(`/users/${user.id}`)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">{user.username ?? "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{user.name ?? "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{user.id ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
                onClick={() => router.push("/dashboard?createTrip=1")}
              >
                Create Trip
              </button>
              <button
                type="button"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
