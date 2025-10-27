import { apiRequest } from "./queryClient";

// Check if user is authenticated via session
export async function checkSession() {
  try {
    const response = await fetch("/api/session", {
      credentials: "include"
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to check session:", error);
    return { authenticated: false };
  }
}

// Logout and destroy session
export async function logout() {
  try {
    await apiRequest("POST", "/api/logout");
    // Clear any local state
    localStorage.clear();
    window.location.href = "/family-setup";
  } catch (error) {
    console.error("Failed to logout:", error);
  }
}

// Check if user has parent privileges
export async function isParentAuthenticated() {
  const session = await checkSession();
  return session.authenticated && (session.userType === 'parent' || session.parentId);
}

// Check if user has family privileges
export async function isFamilyAuthenticated() {
  const session = await checkSession();
  return session.authenticated && session.familyId;
}

// Get current session info
export async function getSessionInfo() {
  const session = await checkSession();
  if (session.authenticated) {
    return {
      familyId: session.familyId,
      parentId: session.parentId,
      childId: session.childId,
      familyCode: session.familyCode,
      userType: session.userType
    };
  }
  return null;
}

// Helper to redirect to login if not authenticated
export async function requireAuth() {
  const session = await checkSession();
  if (!session.authenticated) {
    window.location.href = "/family-setup";
    return false;
  }
  return true;
}

// Helper to redirect to login if not parent
export async function requireParentAuth() {
  const isParent = await isParentAuthenticated();
  if (!isParent) {
    window.location.href = "/family-setup";
    return false;
  }
  return true;
}