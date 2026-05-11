"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const apiService = useApi();
  const { value: token, hasRehydrated: tokenReady } = useLocalStorage<string>("token", "");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenReady) {
      return;
    }

    if (!token) {
      router.push("/login");
      return;
    }

    const userId = params?.id;
    if (!userId) {
      setError("Missing user id.");
      setLoading(false);
      return;
    }

    const loadUser = async () => {
      try {
        setLoading(true);
        const response = await apiService.get<User>(`/users/${userId}`);
        setUser(response);
      } catch (requestError) {
        const err = requestError as Error;
        setError(err.message || "Failed to load user profile.");
      } finally {
        setLoading(false);
      }
    };

    void loadUser();
  }, [apiService, params, router, token, tokenReady]);

  if (!tokenReady || !token) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-app-dark flex items-center justify-center p-6">
        <div className="rounded-2xl bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <p className="text-lg text-gray-900">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-app-dark flex items-center justify-center p-6">
        <div className="rounded-2xl bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)] max-w-md text-center">
          <p className="text-lg text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-dark flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">User profile</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">{user?.username ?? "Unknown user"}</h1>

        <div className="mt-6 grid gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">User ID</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{user?.id ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{user?.status ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Created</p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {user?.creationDate ? new Date(user.creationDate).toLocaleDateString() : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Bio</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{user?.bio?.trim() || "No bio provided."}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.push("/users")}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Back to users
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-lg bg-[#2684ff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f6fe0]"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
