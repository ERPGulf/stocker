import { store } from '@/redux/Store';
import { selectBaseUrl } from "@/redux/Slices/UserSlice";

export type TokenResponse = {
    data?: {
      access_token?: string;
      expires_in?: number;
      token_type?: string;
      scope?: string;
      refresh_token?: string;
    };
    [key: string]: any;
  };

// Function to get the current base URL from Redux store
const getBaseUrl = (): string => {
  const state = store.getState();
  return selectBaseUrl(state) || '';
};

const GENERATE_TOKEN_PATH = 'api/method/gpos.gpos.pos.generate_token_secure';

// Function to get the full token URL
const getTokenUrl = (): string => {
  const baseURL = getBaseUrl();
  return baseURL ? `${baseURL}${GENERATE_TOKEN_PATH}` : '';
};
  
  export async function generateToken(): Promise<{
    access_token: string;
    expires_at: number;
  } | null> {
    const api_key = process.env.EXPO_PUBLIC_API_KEY || "";
    const api_secret = process.env.EXPO_PUBLIC_API_SECRET || "";
    const app_key = process.env.EXPO_PUBLIC_APP_KEY || "";
  
    if (!api_key || !api_secret || !app_key) {
      console.warn("[auth] Missing API credentials");
      return null;
    }
  
    // ✅ Build body just like curl --data-urlencode
    const body = new URLSearchParams();
    body.append("api_key", api_key);
    body.append("api_secret", api_secret);
    body.append("app_key", app_key);
  
    try {
      const tokenUrl = getTokenUrl();
      if (!tokenUrl) {
        console.warn('Base URL is not set');
        return null;
      }
      
      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: "full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image=",
        },
        body: body.toString(), // send as form-urlencoded
      });

      const data: TokenResponse = await response.json();
      const accessToken = data?.data?.access_token;

      if (!accessToken) {
        console.warn("[auth] No access token in response", data);
        return null;
      }

      // Calculate expiry time (default to 1 hour if not provided)
      const expiresIn = data?.data?.expires_in || 3600;
      const expiresAt = Date.now() + expiresIn * 1000;

      return { access_token: accessToken, expires_at: expiresAt };
    } catch (error) {
      console.error("[auth] Error generating token:", error);
      return null;
    }
  }