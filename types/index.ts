export interface ApiResponse<T> {
  success: boolean
  data: T
}

export interface ApiError {
  success: false
  error: string
  message?: string
}

// ==================== User Types ====================
export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  avatar_url?: string
  admin?: boolean
}

export interface UserProfile extends User {
  hint?: string
  // Composed display string of address_components (or legacy free text)
  address?: string
  address_components?: AddressComponents | null
  // True once the backend has coordinates for the address
  address_verified?: boolean
  created_at: string
}

export interface PublicUserProfile {
  id: number
  username: string
  first_name: string
  last_name: string
  avatar_url?: string
  hint?: string
  address?: string
  address_components?: AddressComponents | null
}

// ==================== Address Types ====================
export interface AddressComponents {
  address_line1: string
  address_line2?: string | null
  city: string
  // 2-letter US state code
  state: string
  zip: string
}

// What PUT /users/me accepts. Coordinates come from a picked suggestion; omit them for manual
// entry and the backend geocodes the address later.
export interface AddressInput extends AddressComponents {
  lat?: number
  lon?: number
}

export interface AddressSuggestion {
  place_id: string
  label: string
  address_line1: string
  city: string
  state: string
  zip: string
  lat: number
  lon: number
  result_type: string
}

// ==================== Auth Types ====================
export interface AuthTokens {
  access_token: string
  refresh_token: string
}

export interface LoginResponse extends AuthTokens {
  user: User
}

export interface RegisterResponse extends AuthTokens {
  user: User
}

export interface OAuthUser extends User {
  is_new_user?: boolean
}

export interface OAuthResponse extends AuthTokens {
  user: OAuthUser
}

// ==================== Group Types ====================
export interface GroupListItem {
  id: number
  name: string
  member_count: number
  is_admin: boolean
  reveal_latest_pairs: boolean
  created_at: string
  member_avatars?: string[]
}

export interface GroupMember {
  user_id: number
  username: string
  first_name: string
  last_name: string
  avatar_url?: string
  is_admin: boolean
  participating: boolean
}

export interface GroupDetail {
  id: number
  name: string
  member_count: number
  reveal_latest_pairs: boolean
  created_at: string
  members: GroupMember[]
}

// ==================== Map Types ====================
export interface MapLocation {
  lat: number
  lon: number
  // "approximate" is snapped to a ~5 km grid; only the viewer's own giftee is "exact"
  precision: "approximate" | "exact"
  // From the member's verified address; may be absent on older backends
  city?: string
  state?: string
}

export interface MapMember {
  user_id: number
  username: string
  first_name: string
  last_name: string
  avatar_url?: string
  is_me: boolean
  is_my_giftee: boolean
  location: MapLocation | null
  // Only present on the viewer's own entry
  location_unavailable_reason?: "opted_out" | "no_verified_address" | "outside_us" | null
}

export interface GroupMap {
  // The viewer's own opt-in for this group
  show_on_map: boolean
  // True if anyone in the group has a non-US address (the map is US-only). Never says who.
  has_non_us_members?: boolean
  members: MapMember[]
}

// ==================== Message Types ====================
export interface MessageSender {
  id: number
  username: string
  first_name: string
  avatar_url?: string
}

export interface GroupMessage {
  id: number
  text: string
  created_at: string
  is_own_message: boolean
  sender: MessageSender
}

export interface PairMessage {
  id: number
  text: string
  created_at: string
  direction: "sent" | "received"
}

// ==================== Santa Types ====================
export interface SantaRelationship {
  channel_id: string
  group_id: number
  group_name: string
  reveal_enabled?: boolean
}

export interface SanteeRelationship {
  channel_id: string
  group_id: number
  group_name: string
  santee: {
    username: string
    first_name: string
    last_name: string
    avatar_url?: string
  }
}

export interface SantaData {
  santas: SantaRelationship[]
  santees: SanteeRelationship[]
}

export interface RevealData {
  secret_santa_username: string
  secret_santa: {
    username: string
    first_name: string
    last_name: string
    avatar_url?: string
  }
  // Up to 10 random group members (may repeat), for the reveal spin
  decoy_usernames: string[]
}

// ==================== Issue Types ====================
export interface IssueResponse {
  issue_id: number
  message: string
}

// ==================== Invite Types ====================
export interface InviteAcceptResponse {
  message: string
  group_id: number
  is_admin: boolean
}
