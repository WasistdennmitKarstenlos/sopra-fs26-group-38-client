"use client";
// For components that need React hooks and browser APIs,
// SSR (server side rendering) has to be disabled.
// Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import React from "react";

const Profile: React.FC = () => {
  return (
    <div className="min-h-screen bg-app-dark flex items-center justify-center p-6">
      <div className="rounded-2xl bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <p className="text-lg text-gray-900">
          <strong>SampleUser</strong>
        </p>
      </div>
    </div>
  );
};

export default Profile;
