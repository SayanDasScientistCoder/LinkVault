const AUTH_STORAGE_KEY = "linkvault_auth";

export function getStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { token: "", user: null };
    const parsed = JSON.parse(raw);
    if (!parsed?.token || !parsed?.user) return { token: "", user: null };
    return { token: String(parsed.token), user: parsed.user };
  } catch (err) {
    return { token: "", user: null };
  }
}

export function setStoredAuth(auth) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
