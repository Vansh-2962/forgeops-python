import { useEffect, useState } from "react";
import { axiosInstance } from "@/config/axios";
import { env } from "@/config/env";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  emailVerified: boolean;
}

interface AuthSession {
  user: AuthUser;
  expiresAt: string;
}

interface SessionResult {
  user: AuthUser | null;
  session: AuthSession | null;
}

const SESSION_EVENT = "forgeops:auth-session";
let cachedSession: SessionResult | undefined;
let sessionRequest: Promise<SessionResult> | undefined;

async function refreshSession(): Promise<SessionResult> {
  const response = await axiosInstance.get<{
    user: AuthUser | null;
    expiresAt: string | null;
  }>("/auth/session");
  cachedSession = {
    user: response.data.user,
    session:
      response.data.user && response.data.expiresAt
        ? { user: response.data.user, expiresAt: response.data.expiresAt }
        : null,
  };
  window.dispatchEvent(new Event(SESSION_EVENT));
  return cachedSession;
}

function loadSession(): Promise<SessionResult> {
  sessionRequest ??= refreshSession().finally(() => {
    sessionRequest = undefined;
  });
  return sessionRequest;
}

export function useSession() {
  const [data, setData] = useState<SessionResult | undefined>(cachedSession);
  const [isPending, setIsPending] = useState(!cachedSession);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let active = true;
    const update = () => {
      if (active && cachedSession) {
        setData(cachedSession);
        setIsPending(false);
      }
    };
    window.addEventListener(SESSION_EVENT, update);
    void loadSession()
      .then((session) => {
        if (active) {
          setData(session);
          setIsPending(false);
        }
      })
      .catch(() => {
        if (active) {
          setError(new Error("Unable to reach the authentication service"));
          setIsPending(false);
        }
      });
    return () => {
      active = false;
      window.removeEventListener(SESSION_EVENT, update);
    };
  }, []);

  return { data, isPending, error };
}

export const signIn = {
  async email(credentials: { email: string; password: string }) {
    await axiosInstance.post("/auth/login", credentials);
    return refreshSession();
  },
  social(options: { provider: "google"; callbackURL?: string }) {
    const returnTo = options.callbackURL
      ? new URL(options.callbackURL, window.location.origin).pathname
      : "/dashboard";
    const url = new URL(`${env.VITE_API_BASE_URL}/auth/google`, window.location.origin);
    url.searchParams.set("return_to", returnTo);
    window.location.assign(url.toString());
  },
};

export const signUp = {
  async email(credentials: { email: string; password: string; name: string }) {
    await axiosInstance.post("/auth/register", credentials);
    return refreshSession();
  },
};

export async function signOut() {
  await axiosInstance.post("/auth/logout");
  cachedSession = { user: null, session: null };
  window.dispatchEvent(new Event(SESSION_EVENT));
}
