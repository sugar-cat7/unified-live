import { HttpResponse, http } from "msw";

export const handlers = [
  // Get session
  http.get("*/api/auth/session", () => {
    return HttpResponse.json({
      user: null,
      session: null,
    });
  }),

  // Social login
  http.post("*/api/auth/signin/social", () => {
    return HttpResponse.json({
      user: { id: "mock-user-1", email: "test@example.com" },
      session: { id: "mock-session-1" },
    });
  }),

  // Sign out
  http.post("*/api/auth/signout", () => {
    return HttpResponse.json({ success: true });
  }),

  // CSRF protection
  http.get("*/api/auth/csrf", () => {
    return HttpResponse.json({
      csrfToken: "mock-csrf-token",
    });
  }),

  // Get session (alternative endpoint)
  http.get("*/api/auth/get-session", () => {
    return HttpResponse.json({
      user: null,
      session: null,
    });
  }),
];
