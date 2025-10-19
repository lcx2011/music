import type { AuthUser } from "@/types/auth";

export const AUTH_STORAGE_KEY = "music-auth-user";

export const getStoredAuthUser = (): AuthUser | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) {
    return null;
  }
  try {
    return JSON.parse(stored) as AuthUser;
  } catch (error) {
    console.warn("Failed to parse stored auth user", error);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export const setStoredAuthUser = (user: AuthUser) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
};

export const clearStoredAuthUser = () => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};
