// Build auth headers using stored JWT and redirect if missing
export function getAuthHeaders() {
  const token = localStorage.getItem("authToken");

  // Redirect to login if user is not authenticated
  if (!token) {
    window.location.href = "registration.html";
    return null;
  }

  // Attach Bearer token for protected API requests
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

// Clear auth state and redirect on unauthorized access
export function handleUnauthorized() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("userLoggedIn");
  localStorage.removeItem("userId");

  // Force re-login
  window.location.href = "registration.html";
}