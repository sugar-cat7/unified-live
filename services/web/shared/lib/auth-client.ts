"use client";

import { createAuthClient } from "better-auth/react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:4001";

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
});
