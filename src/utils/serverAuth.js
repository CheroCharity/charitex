import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function extractBearerToken(authHeader) {
  return String(authHeader || "").replace(/^Bearer\s+/i, "").trim();
}

function decodeBase64Url(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function isTlsCertificateError(error) {
  const code = error?.cause?.code || error?.code;
  const message = String(error?.cause?.message || error?.message || "").toLowerCase();

  return (
    code === "UNABLE_TO_GET_ISSUER_CERT_LOCALLY" ||
    code === "SELF_SIGNED_CERT_IN_CHAIN" ||
    message.includes("unable to get local issuer certificate") ||
    message.includes("self signed certificate")
  );
}

function verifySupabaseJwt(token, jwtSecret) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) {
    throw new Error("Malformed access token.");
  }

  const [headerPart, payloadPart, signaturePart] = parts;
  const header = JSON.parse(decodeBase64Url(headerPart));

  if (header.alg !== "HS256") {
    throw new Error("Unsupported token algorithm.");
  }

  const signingInput = `${headerPart}.${payloadPart}`;
  const expectedSignature = createHmac("sha256", jwtSecret).update(signingInput).digest();
  const providedSignature = Buffer.from(signaturePart, "base64url");

  if (expectedSignature.length !== providedSignature.length || !timingSafeEqual(expectedSignature, providedSignature)) {
    throw new Error("Access token signature is invalid.");
  }

  const payload = JSON.parse(decodeBase64Url(payloadPart));
  const now = Math.floor(Date.now() / 1000);

  if (typeof payload.exp === "number" && payload.exp <= now) {
    throw new Error("Access token has expired.");
  }

  if (typeof payload.nbf === "number" && payload.nbf > now) {
    throw new Error("Access token is not active yet.");
  }

  if (!payload.sub) {
    throw new Error("Access token missing subject.");
  }

  return payload;
}

function buildActorFromPayload(payload) {
  return {
    id: payload.sub,
    email: payload.email || null,
  };
}

export async function getActorFromTokenWithFallback({ url, serviceRoleKey, authHeader }) {
  const accessToken = extractBearerToken(authHeader);
  if (!accessToken) return null;

  const actorClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const {
      data: { user },
      error,
    } = await actorClient.auth.getUser(accessToken);

    if (error || !user) return null;
    return user;
  } catch (error) {
    if (!isTlsCertificateError(error)) {
      throw error;
    }

    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
      throw new Error(
        "Token verification failed due to local TLS certificate trust. Set SUPABASE_JWT_SECRET for local JWT verification fallback, or trust your local CA via NODE_EXTRA_CA_CERTS."
      );
    }

    const payload = verifySupabaseJwt(accessToken, jwtSecret);
    return buildActorFromPayload(payload);
  }
}