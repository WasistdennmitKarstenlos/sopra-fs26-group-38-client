// Dashboard: shows a list of all registered users (authenticated route).
// Clicking a user row navigates to /users/[id].
"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Card, Divider, Table } from "antd";
import type { TableProps } from "antd";

// Columns for the antd table of User objects
const columns: TableProps<User>["columns"] = [
  {
    title: "Username",
    dataIndex: "username",
    key: "username",
  },
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Id",
    dataIndex: "id",
    key: "id",
  },
];

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
      <div className="card-container">
        <Card className="dashboard-container" style={{ textAlign: "center" }}>
          <h2>This page is only accessible for logged-in users.</h2>
          <div style={{ marginTop: "20px" }}>
            <Button type="primary" onClick={() => router.push("/login")}>
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="card-container">
      <Card
        title="All users"
        loading={!users}
        className="dashboard-container"
      >
        {users && (
          <>
            {/* antd Table: pass the columns and data, plus a rowKey for stable row identity */}
            <Table<User>
              columns={columns}
              dataSource={users}
              rowKey="id"
              onRow={(row) => ({
                onClick: () => router.push(`/users/${row.id}`),
                style: { cursor: "pointer" },
              })}
            />
            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <Button
                type="primary"
                onClick={() => router.push("/trips/create")}
              >
                Create Trip
              </Button>
              <Button onClick={handleLogout}>Logout</Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
