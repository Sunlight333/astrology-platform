import type { User, LoginRequest, RegisterRequest, AuthTokens } from '@star/shared';
import type { BirthProfile, NatalChart } from '@star/shared';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include', // sends httpOnly cookies for refresh token
  });

  if (res.status === 401 && accessToken) {
    // try refresh
    const refreshed = await refreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      const retry = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      });
      if (!retry.ok) {
        throw new ApiError(retry.status, await retry.text());
      }
      return retry.json();
    }
    throw new ApiError(401, 'Sessao expirada');
  }

  if (!res.ok) {
    let message: string;
    try {
      const body = await res.json();
      message = body.message || body.error || res.statusText;
    } catch {
      message = res.statusText;
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Auth ──

export async function login(data: LoginRequest): Promise<{ user: User; accessToken: string }> {
  const result = await request<{ user: User; accessToken: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  accessToken = result.accessToken;
  return result;
}

export async function register(data: RegisterRequest): Promise<{ user: User; accessToken: string }> {
  const result = await request<{ user: User; accessToken: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  accessToken = result.accessToken;
  return result;
}

export async function refreshToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return false;
    const data = await res.json();
    accessToken = data.accessToken;
    return true;
  } catch {
    return false;
  }
}

export async function getMe(): Promise<User> {
  const result = await request<{ user: User }>('/auth/me');
  return result.user;
}

// ── Profiles ──

export interface CreateProfileData {
  name: string;
  birthDate: string;
  birthTime: string;
  birthCity: string;
}

export async function createProfile(data: CreateProfileData): Promise<BirthProfile> {
  return request<BirthProfile>('/profiles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getProfiles(): Promise<BirthProfile[]> {
  return request<BirthProfile[]>('/profiles');
}

export async function getProfile(id: string): Promise<BirthProfile> {
  return request<BirthProfile>(`/profiles/${id}`);
}

// ── Charts ──

export async function calculateChart(profileId: string): Promise<NatalChart> {
  return request<NatalChart>('/charts/calculate', {
    method: 'POST',
    body: JSON.stringify({ birthProfileId: profileId }),
  });
}

export async function getChart(id: string): Promise<NatalChart> {
  return request<NatalChart>(`/charts/${id}`);
}

export async function getChartByProfile(profileId: string): Promise<NatalChart | null> {
  try {
    return await request<NatalChart>(`/charts/profile/${profileId}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

// ── Payments ──

export interface CheckoutResponse {
  checkoutUrl: string;
  orderId: string;
}

export async function createCheckout(data: {
  productType: 'natal_chart' | 'transit_report';
  profileId: string;
}): Promise<CheckoutResponse> {
  return request<CheckoutResponse>('/payments/checkout', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface Order {
  id: string;
  userId: string;
  productType: string;
  status: 'pending' | 'paid' | 'refunded';
  amount: number;
  createdAt: string;
}

export async function getOrderStatus(orderId: string): Promise<Order> {
  return request<Order>(`/payments/orders/${orderId}`);
}

export async function getOrders(): Promise<Order[]> {
  return request<Order[]>('/payments/orders');
}

// ── Transits ──

import type { TransitAspect, TransitReport, TransitEvent, TransitPosition } from '@star/shared';

export type { TransitAspect, TransitReport, TransitEvent, TransitPosition };

export interface ActiveTransitsResponse {
  transits: TransitAspect[];
  transitPositions: TransitPosition[];
  isPaid: boolean;
}

export async function getActiveTransits(profileId: string): Promise<ActiveTransitsResponse> {
  return request<ActiveTransitsResponse>(`/transits/${profileId}`);
}

export async function getTransitRange(
  profileId: string,
  start: string,
  end: string,
): Promise<TransitEvent[]> {
  return request<TransitEvent[]>(`/transits/${profileId}/range?start=${start}&end=${end}`);
}
