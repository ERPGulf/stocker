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
  
  const GENERATE_TOKEN_URL =
    "https://aysha.erpgulf.com/api/method/gpos.gpos.pos.generate_token_secure";
  
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
  
    const res = await fetch(GENERATE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie:
          "full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image=",
      },
      body: body.toString(), // send as form-urlencoded
    });
  
    // 🔍 Debug
    console.log("➡️ Request:", {
      url: GENERATE_TOKEN_URL,
      body: body.toString(),
    });
    console.log("⬅️ Status:", res.status, res.statusText);
  
    const text = await res.text();
    console.log("⬅️ Raw response text:", text);
  
    let json: TokenResponse;
    try {
      json = JSON.parse(text);
      console.log("⬅️ Parsed JSON:", JSON.stringify(json, null, 2));
    } catch {
      throw new Error(`generateToken failed: Response was not JSON -> ${text}`);
    }
  
    const access_token = json?.data?.access_token ?? "";
    const expires_in = Number(json?.data?.expires_in ?? 0);
  
    if (!access_token) {
      console.warn("⚠️ No access_token in response");
      return null;
    }
  
    const now = Math.floor(Date.now() / 1000);
    return { access_token, expires_at: now + expires_in - 30 };
  }
  