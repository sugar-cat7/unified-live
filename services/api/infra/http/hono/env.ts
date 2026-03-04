import type { RequestIdVariables } from "hono/request-id";
import type { Container } from "../../di/container";

export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Session = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
};

export type HonoEnv = {
  Variables: RequestIdVariables & {
    container: Container;
    userId: string;
    user: User;
    session: Session;
  };
};
