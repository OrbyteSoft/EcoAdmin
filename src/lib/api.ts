const BASE_URL = "http://localhost:3000/api/v1";

let isRedirecting = false;

/**
 * Endpoints that must NEVER trigger the refresh/redirect flow.
 * - Auth endpoints: obvious reasons
 * - /auth/me: used on page load to restore session — if the token is
 *   expired here, we want to silently clear and show login, NOT redirect
 *   with isRedirecting=true which would block the next real login attempt.
 */
const SKIP_REFRESH_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/me",
];

export function getToken(): string | null {
  return localStorage.getItem("access_token");
}

export function getRefreshToken(): string | null {
  return localStorage.getItem("refresh_token");
}

export function getUserRole(): string | null {
  return localStorage.getItem("user_role");
}

export function setTokens(access: string, refresh: string, role: string): void {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
  localStorage.setItem("user_role", role);
}

export function clearTokens(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_role");
  // Always reset so the next login attempt is never blocked
  isRedirecting = false;
}

async function attemptRefresh(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${rt}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) return false;

    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken, data.user.role);
    return true;
  } catch {
    return false;
  }
}

function parseErrorMessage(data: any): string {
  if (!data?.message) return "Something went wrong";
  if (Array.isArray(data.message)) return data.message.join(", ");
  return data.message;
}

export async function api<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  const isSkipped = SKIP_REFRESH_ENDPOINTS.some((e) => endpoint.includes(e));

  if (res.status === 401 && !isSkipped) {
    const refreshed = await attemptRefresh();

    if (refreshed) {
      headers["Authorization"] = `Bearer ${getToken()}`;
      res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    } else {
      clearTokens();

      if (!window.location.pathname.includes("/login") && !isRedirecting) {
        isRedirecting = true;
        window.location.href = "/login?error=expired";
      }

      throw new Error("Session Expired");
    }
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 403) throw new Error("Access Denied: Admins Only");
    throw new Error(parseErrorMessage(data));
  }

  return data;
}
