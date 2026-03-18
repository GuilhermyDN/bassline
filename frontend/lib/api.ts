const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export interface User {
  id: string; name: string; email: string;
  user_type: "DJ" | "CLUB" | "FAN";
  city?: string; state?: string; avatar_url?: string;
  is_active: boolean; created_at: string;
}
export interface DJProfile {
  id: string; user_id: string; stage_name: string; bio?: string; genres?: string;
  instagram_url?: string; soundcloud_url?: string; youtube_url?: string;
  presskit_pdf_url?: string; tech_rider_pdf_url?: string; hospitality_rider_pdf_url?: string;
  created_at: string; updated_at: string;
  // campos enriquecidos via join com User
  name?: string; city?: string; state?: string; avatar_url?: string;
}
export interface ClubProfile {
  id: string; user_id: string; club_name: string; description?: string;
  instagram_url?: string; city?: string; state?: string;
  created_at: string; updated_at: string;
}
export interface Booking {
  id: string; dj_id: string; club_id: string; event_name: string;
  event_date?: string; fee_amount?: number; start_time?: string; end_time?: string;
  logistics?: string; notes?: string;
  status: "PROPOSTA" | "NEGOCIANDO" | "APROVADO" | "RECUSADO" | "CANCELADO";
  created_at: string; updated_at: string;
}
export interface BookingMessage {
  id: string; booking_id: string; sender_user_id: string; message: string; created_at: string;
}
export type SubscriptionStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED";
export type PlanType = "DJ_FREE" | "DJ_PRO" | "CLUB_FREE" | "CLUB_PRO";
export interface Subscription {
  id: string; user_id: string; plan: PlanType; status: SubscriptionStatus;
  trial_ends_at?: string; current_period_end?: string;
  stripe_customer_id?: string; stripe_subscription_id?: string; created_at: string;
}
export interface AuthResponse { access_token: string; token_type: string; user: User; }
export interface RegisterPayload {
  name: string; email: string; password: string;
  user_type: "DJ" | "CLUB" | "FAN"; city?: string; state?: string;
  // DJ
  stage_name?: string; bio?: string; genres?: string;
  // Club
  club_name?: string; description?: string;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("bassline_token");
}
function setToken(t: string) { localStorage.setItem("bassline_token", t); }
function clearToken() { localStorage.removeItem("bassline_token"); localStorage.removeItem("bassline_user"); }
function setUser(u: User) { localStorage.setItem("bassline_user", JSON.stringify(u)); }
export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("bassline_user");
  return raw ? JSON.parse(raw) : null;
}

async function request<T>(path: string, options: RequestInit = {}, auth = false): Promise<T> {
  const headers: Record<string,string> = { ...(options.headers as Record<string,string>) };
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  headers["ngrok-skip-browser-warning"] = "true";
  if (auth) { const t = getToken(); if (t) headers["Authorization"] = `Bearer ${t}`; }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) { const e = await res.json().catch(() => ({ detail: res.statusText })); throw new Error(e.detail || "Erro"); }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function register(p: RegisterPayload): Promise<AuthResponse> {
  const d = await request<AuthResponse>("/auth/register", { method:"POST", body:JSON.stringify(p) });
  setToken(d.access_token); setUser(d.user); return d;
}
export async function login(email: string, password: string): Promise<AuthResponse> {
  const d = await request<AuthResponse>("/auth/login", { method:"POST", body:JSON.stringify({email,password}) });
  setToken(d.access_token); setUser(d.user); return d;
}
export function logout() { clearToken(); }
export async function getMe(): Promise<User> { return request<User>("/auth/me",{},true); }

export async function uploadAvatar(file: File, removeBg = false): Promise<User> {
  const fd = new FormData(); fd.append("file", file);
  const token = getToken();
  const res = await fetch(`${API_BASE}/users/me/avatar?remove_bg=${removeBg}`, {
    method:"POST", headers: token ? { Authorization:`Bearer ${token}` } : {}, body: fd,
  });
  if (!res.ok) { const e = await res.json().catch(()=>({detail:res.statusText})); throw new Error(e.detail); }
  const u = await res.json(); setUser(u); return u;
}

export async function listDJs(): Promise<DJProfile[]> { return request<DJProfile[]>("/djs"); }
export async function getDJ(id: string): Promise<DJProfile> { return request<DJProfile>(`/djs/${id}`); }
export async function getMyDJProfile(): Promise<DJProfile> { return request<DJProfile>("/djs/me",{},true); }
export async function createMyDJProfile(p: Partial<DJProfile>): Promise<DJProfile> { return request<DJProfile>("/djs/me",{method:"POST",body:JSON.stringify(p)},true); }
export async function updateMyDJProfile(p: Partial<DJProfile>): Promise<DJProfile> { return request<DJProfile>("/djs/me",{method:"PUT",body:JSON.stringify(p)},true); }

export async function getMyClubProfile(): Promise<ClubProfile> { return request<ClubProfile>("/clubs/me",{},true); }
export async function createMyClubProfile(p: Partial<ClubProfile>): Promise<ClubProfile> { return request<ClubProfile>("/clubs/me",{method:"POST",body:JSON.stringify(p)},true); }
export async function updateMyClubProfile(p: Partial<ClubProfile>): Promise<ClubProfile> { return request<ClubProfile>("/clubs/me",{method:"PUT",body:JSON.stringify(p)},true); }

export async function createBooking(p: { dj_profile_id:string; event_name:string; event_date?:string; fee_amount?:number; start_time?:string; end_time?:string; logistics?:string; notes?:string; }): Promise<Booking> { return request<Booking>("/bookings",{method:"POST",body:JSON.stringify(p)},true); }
export async function getMySentBookings(): Promise<Booking[]> { return request<Booking[]>("/bookings/me/sent",{},true); }
export async function getMyReceivedBookings(): Promise<Booking[]> { return request<Booking[]>("/bookings/me/received",{},true); }
export async function getBooking(id: string): Promise<Booking> { return request<Booking>(`/bookings/${id}`,{},true); }
export async function updateBookingStatus(id: string, status: string, reason?: string): Promise<Booking> { return request<Booking>(`/bookings/${id}/status`,{method:"PATCH",body:JSON.stringify({status,reason})},true); }
export async function getBookingHistory(id: string) { return request<unknown[]>(`/bookings/${id}/history`,{},true); }

export async function sendMessage(bookingId: string, message: string): Promise<BookingMessage> { return request<BookingMessage>(`/booking-messages/${bookingId}`,{method:"POST",body:JSON.stringify({message})},true); }
export async function getMessages(bookingId: string): Promise<BookingMessage[]> { return request<BookingMessage[]>(`/booking-messages/${bookingId}`,{},true); }

export async function listAvailability() { return request<unknown[]>("/availability/me",{},true); }
export async function createAvailability(p: {start_time:string;end_time:string;title?:string}) { return request<unknown>("/availability",{method:"POST",body:JSON.stringify(p)},true); }
export async function deleteAvailability(id: string) { return request<void>(`/availability/${id}`,{method:"DELETE"},true); }

export async function getMySubscription(): Promise<Subscription> { return request<Subscription>("/stripe/subscription",{},true); }
export async function createCheckoutSession(): Promise<{checkout_url:string}> { return request<{checkout_url:string}>("/stripe/checkout",{method:"POST"},true); }
export async function createPortalSession(): Promise<{portal_url:string}> { return request<{portal_url:string}>("/stripe/portal",{method:"POST"},true); }

export function isSubscriptionActive(sub: Subscription | null): boolean {
  if (!sub) return false;
  return sub.status === "ACTIVE" || sub.status === "TRIALING";
}
export function trialDaysLeft(sub: Subscription | null): number {
  if (!sub?.trial_ends_at) return 0;
  const diff = new Date(sub.trial_ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000*60*60*24)));
}
