import type {
  ApiResponse,
  UserProfile,
  PublicUserProfile,
  LoginResponse,
  RegisterResponse,
  OAuthResponse,
  GroupListItem,
  GroupDetail,
  GroupMessage,
  PairMessage,
  SantaData,
  RevealData,
  IssueResponse,
  InviteAcceptResponse,
} from "@/types"
import { apiErrorMessage } from "@/lib/utils"

// ==================== Configuration ====================
// Use API proxy route to avoid CORS and handle self-signed certs
// const API_BASE = "https://api.mysecretsanta.io"
const API_BASE = "/api/proxy"

// ==================== Token Management ====================
function getAccessToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("access_token")
  }
  return null
}

function getRefreshToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("refresh_token")
  }
  return null
}

function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", accessToken)
    localStorage.setItem("refresh_token", refreshToken)
  }
}

function clearTokens(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
  }
}

// ==================== Base Fetch Utilities ====================
async function baseFetch<T>(endpoint: string, options: RequestInit = {}, requiresAuth = true): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers)
  headers.set("Content-Type", "application/json")

  if (requiresAuth) {
    const token = getAccessToken()
    if (!token) {
      throw new Error("No authentication token found")
    }
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  // Handle token refresh on 401
  if (response.status === 401 && requiresAuth) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      headers.set("Authorization", `Bearer ${getAccessToken()}`)
      const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      })
      return parseResponse<T>(retryResponse)
    }
    clearTokens()
    // Also end the server-side cookie session and send the user to /login
    window.location.assign("/api/auth/clear")
    throw new Error("Session expired. Please log in again.")
  }

  return parseResponse<T>(response)
}

// Backend crashes return an HTML debug page, not JSON
async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const text = await response.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(response.ok ? "Unexpected response from server" : `Server error (${response.status})`)
  }

  if (!response.ok) {
    throw new Error(apiErrorMessage(data, `Request failed (${response.status})`))
  }

  return data
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  try {
    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
    })

    if (!response.ok) return false

    const data: ApiResponse<{ access_token: string }> = await response.json()
    if (data.success && data.data.access_token) {
      localStorage.setItem("access_token", data.data.access_token)
      return true
    }
    return false
  } catch {
    return false
  }
}

// ==================== Auth API ====================
export const authApi = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await baseFetch<LoginResponse>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ username, password }),
      },
      false,
    )
    if (response.success) {
      setTokens(response.data.access_token, response.data.refresh_token)
    }
    return response.data
  },

  async register(data: {
    username: string
    email: string
    password: string
    first_name: string
    last_name: string
  }): Promise<RegisterResponse> {
    const response = await baseFetch<RegisterResponse>(
      "/api/auth/register",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      false,
    )
    if (response.success) {
      setTokens(response.data.access_token, response.data.refresh_token)
    }
    return response.data
  },

  async logout(): Promise<void> {
    try {
      await baseFetch<{ message: string }>("/api/auth/logout", { method: "POST" })
    } finally {
      clearTokens()
    }
  },

  async resetPassword(email: string): Promise<{ message: string }> {
    const response = await baseFetch<{ message: string }>(
      "/api/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      },
      false,
    )
    return response.data
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await baseFetch<{ message: string }>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    })
    return response.data
  },

  async getGoogleOAuthUrl(redirectUri: string, state?: string): Promise<{ oauth_url: string }> {
    const params = new URLSearchParams({ redirect_uri: redirectUri })
    if (state) params.append("state", state)
    const response = await baseFetch<{ oauth_url: string }>(
      `/api/auth/oauth/google/url?${params.toString()}`,
      { method: "GET" },
      false,
    )
    return response.data
  },

  async handleGoogleCallback(code: string, redirectUri: string): Promise<OAuthResponse> {
    const response = await baseFetch<OAuthResponse>(
      "/api/auth/oauth/google/callback",
      {
        method: "POST",
        body: JSON.stringify({ code, redirect_uri: redirectUri }),
      },
      false,
    )
    if (response.success) {
      setTokens(response.data.access_token, response.data.refresh_token)
    }
    return response.data
  },

  isAuthenticated(): boolean {
    return !!getAccessToken()
  },
}

// ==================== Users API ====================
export const usersApi = {
  async getMe(): Promise<UserProfile> {
    const response = await baseFetch<UserProfile>("/api/users/me")
    return response.data
  },

  async updateMe(data: {
    first_name?: string
    last_name?: string
    hint?: string
    address?: string
  }): Promise<UserProfile> {
    const response = await baseFetch<UserProfile>("/api/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    })
    return response.data
  },

  async getUser(username: string): Promise<PublicUserProfile> {
    const response = await baseFetch<PublicUserProfile>(`/api/users/${username}`)
    return response.data
  },
}

// ==================== Groups API ====================
export const groupsApi = {
  async list(): Promise<GroupListItem[]> {
    const response = await baseFetch<GroupListItem[]>("/api/groups")
    return response.data
  },

  async get(groupId: number): Promise<GroupDetail> {
    const response = await baseFetch<GroupDetail>(`/api/groups/${groupId}`)
    return response.data
  },

  async create(name: string): Promise<GroupDetail> {
    const response = await baseFetch<GroupDetail>("/api/groups", {
      method: "POST",
      body: JSON.stringify({ name }),
    })
    return response.data
  },

  async inviteMember(groupId: number, email: string): Promise<{ message: string }> {
    const response = await baseFetch<{ message: string }>(`/api/groups/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify({ email }),
    })
    return response.data
  },

  async removeMember(groupId: number, userId: number): Promise<{ message: string }> {
    const response = await baseFetch<{ message: string }>(`/api/groups/${groupId}/members/${userId}`, {
      method: "DELETE",
    })
    return response.data
  },

  async leave(groupId: number): Promise<{ message: string }> {
    const response = await baseFetch<{ message: string }>(`/api/groups/${groupId}/membership`, {
      method: "DELETE",
    })
    return response.data
  },

  async createPairs(groupId: number): Promise<{ message: string }> {
    const response = await baseFetch<{ message: string }>(`/api/groups/${groupId}/pairs`, {
      method: "POST",
    })
    return response.data
  },

  async toggleReveal(groupId: number, reveal: boolean): Promise<{ message: string; reveal_latest_pairs: boolean }> {
    const response = await baseFetch<{ message: string; reveal_latest_pairs: boolean }>(
      `/api/groups/${groupId}/reveal`,
      {
        method: "POST",
        body: JSON.stringify({ reveal }),
      },
    )
    return response.data
  },
}

// ==================== Messages API ====================
export const messagesApi = {
  // Group messages
  async getGroupMessages(groupId: number): Promise<GroupMessage[]> {
    const response = await baseFetch<GroupMessage[]>(`/api/groups/${groupId}/messages`)
    return response.data
  },

  async sendGroupMessage(groupId: number, message: string): Promise<GroupMessage> {
    const response = await baseFetch<GroupMessage>(`/api/groups/${groupId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message }),
    })
    return response.data
  },

  // Pair messages (anonymous santa/santee chat)
  async getPairMessages(channelId: string): Promise<PairMessage[]> {
    const response = await baseFetch<PairMessage[]>(`/api/pairs/${channelId}/messages`)
    return response.data
  },

  async sendPairMessage(channelId: string, message: string): Promise<PairMessage> {
    const response = await baseFetch<PairMessage>(`/api/pairs/${channelId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message }),
    })
    return response.data
  },
}

// ==================== Santa API ====================
export const santaApi = {
  async getRelationships(): Promise<SantaData> {
    const response = await baseFetch<SantaData>("/api/santa")
    return response.data
  },

  async reveal(groupName: string): Promise<RevealData> {
    const response = await baseFetch<RevealData>(`/api/santa/reveal?group_name=${encodeURIComponent(groupName)}`)
    return response.data
  },
}

// ==================== Invites API ====================
export const invitesApi = {
  async accept(code: string): Promise<InviteAcceptResponse> {
    const response = await baseFetch<InviteAcceptResponse>(`/api/invites/${code}/accept`, {
      method: "POST",
    })
    return response.data
  },
}

// ==================== Issues API ====================
export const issuesApi = {
  async report(title: string, description: string): Promise<IssueResponse> {
    const response = await baseFetch<IssueResponse>("/api/issues", {
      method: "POST",
      body: JSON.stringify({ title, description }),
    })
    return response.data
  },
}

// ==================== Legacy Exports (for backward compatibility) ====================
export async function logout(): Promise<void> {
  return authApi.logout()
}

export async function fetchGroups(): Promise<GroupListItem[]> {
  return groupsApi.list()
}

export async function fetchGroup(id: string): Promise<GroupDetail> {
  return groupsApi.get(Number(id))
}

export async function createNewGroup(data: { name: string }): Promise<GroupDetail> {
  return groupsApi.create(data.name)
}

export async function fetchMessages(channelId: string): Promise<PairMessage[]> {
  return messagesApi.getPairMessages(channelId)
}

export async function sendNewMessage(channelId: string, message: string): Promise<PairMessage> {
  return messagesApi.sendPairMessage(channelId, message)
}

export async function fetchUser(username: string): Promise<PublicUserProfile> {
  return usersApi.getUser(username)
}

// Error helper
export function isApiError(error: unknown): error is Error {
  return error instanceof Error
}
