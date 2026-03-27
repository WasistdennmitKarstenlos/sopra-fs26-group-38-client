"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button, Form, Input, message, Spin } from "antd";
import { useApi } from "@/hooks/useApi";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Trip } from "@/types/trip";
import { User } from "@/types/user";
import styles from "@/styles/page.module.css";

export default function CreateTrip() {
  const router = useRouter();
  const apiService = useApi();
  const { getItem } = useLocalStorage();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Check if user is logged in
  useEffect(() => {
    const storedUser = getItem("user");
    if (!storedUser) {
      message.error("Please log in first");
      router.push("/login");
      return;
    }
    setUser(storedUser);
  }, [getItem, router]);

  const onFinish = useCallback(
    async (values: { tripName: string }) => {
      if (!user || !user.id) {
        message.error("User not authenticated");
        return;
      }

      setLoading(true);
      try {
        const tripData = {
          name: values.tripName,
        };

        const response = await apiService.post<Trip>("/trips", tripData);

        if (response && response.id && response.roomCode) {
          message.success("Trip created successfully!");
          // Redirect to trip room page with room code
          router.push(`/trips/${response.roomCode}`);
        }
      } catch (error) {
        const err = error as Error & { status?: number; info?: string };
        if (err.status === 409) {
          message.error("Trip name already exists. Please choose another name.");
        } else if (err.status === 400) {
          message.error("Invalid trip name. Please provide a valid name.");
        } else {
          message.error(
            err.message || "Failed to create trip. Please try again."
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [user, apiService, router]
  );

  if (!user) {
    return (
      <div className={styles.center}>
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  return (
    <div className={styles.center}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <h1 style={{ textAlign: "center", marginBottom: 30 }}>Create a New Trip</h1>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Trip Name"
            name="tripName"
            rules={[
              {
                required: true,
                message: "Please enter a trip name",
              },
              {
                min: 1,
                message: "Trip name must not be empty",
              },
            ]}
          >
            <Input
              placeholder="e.g., Summer Vacation 2026"
              disabled={loading}
              maxLength={100}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{ marginTop: 10 }}
            >
              {loading ? "Creating Trip..." : "Create Trip"}
            </Button>
          </Form.Item>
        </Form>

        <Button
          type="link"
          block
          onClick={() => router.push("/users")}
          disabled={loading}
          style={{ marginTop: 10 }}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
