import { isProduction } from "@/utils/environment";
/**
 * Returns the API base URL based on the current environment.
 * In production it retrieves the URL from NEXT_PUBLIC_PROD_API_URL.
 * In development, it retrieves the URL from NEXT_PUBLIC_DEV_API_URL.
 * If env vars are missing, fallback URLs are used.
 */
export function getApiDomain(): string {
  const prodUrl =
    process.env.NEXT_PUBLIC_PROD_API_URL?.trim() ||
    "https://sopra-fs26-group-38-server.oa.r.appspot.com";
  const devUrl =
    process.env.NEXT_PUBLIC_DEV_API_URL?.trim() || "http://localhost:8080";
  return isProduction() ? prodUrl : devUrl;
}
