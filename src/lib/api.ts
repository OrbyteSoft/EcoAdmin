const BASE_URL = "http://localhost:3000/api/v1";

// Prevents the app from trying to redirect to login multiple times simultaneously
let isRedirecting = false;

export function getToken() {
  return localStorage.getItem("access_token");
}

export function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}

export function getUserRole() {
  return localStorage.getItem("user_role");
}

export function setTokens(access: string, refresh: string, role: string) {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
  localStorage.setItem("user_role", role);
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_role");
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

  let res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle Token Expiration
  if (res.status === 401 && !endpoint.includes("/auth/refresh")) {
    const refreshed = await attemptRefresh();

    if (refreshed) {
      // Retry the original request with new token
      headers["Authorization"] = `Bearer ${getToken()}`;
      res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    } else {
      // REFRESH FAILED: Clean up and redirect
      clearTokens();

      const isLoginPage = window.location.pathname.includes("/login");

      if (!isLoginPage && !isRedirecting) {
        isRedirecting = true;
        window.location.href = "/login?error=expired";
      }

      throw new Error("Session Expired");
    }
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error("Access Denied: Admins Only");
    }
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}
