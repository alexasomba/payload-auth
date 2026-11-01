import type { CollectionAfterLogoutHook, PayloadRequest } from "payload";
import { baModelKey } from "@/better-auth/plugin/constants";
import { getCollectionByModelKey } from "@/better-auth/plugin/helpers/get-collection";
import { getPayloadAuth } from "@/better-auth/plugin/lib/get-payload-auth";

export function getAfterLogoutHook() {
  const hook: CollectionAfterLogoutHook = async ({ req }) => {
    const payload = await getPayloadAuth(req.payload.config);
    // The host can retain the generated schema while deferring the runtime.
    if (!payload.betterAuth) return;
    const { sessionToken } = (await payload.betterAuth.$context).authCookies;
    const rawCookieValue = getCookieValue(
      req.headers.get("cookie"),
      sessionToken.name
    );
    const sessionsSlug = getCollectionByModelKey(
      req.payload.collections,
      baModelKey.session
    ).slug;

    await deleteSessionFromDb(payload, sessionsSlug, rawCookieValue, req);
  };

  return hook;
}

function getCookieValue(cookieHeader: string | null, cookieName: string) {
  if (!cookieHeader) return undefined;
  const names = new Set([
    cookieName,
    cookieName.replace(/^__Secure-/, ""),
    cookieName.startsWith("__Secure-") ? cookieName : `__Secure-${cookieName}`
  ]);

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    const name = part.slice(0, separator).trim();
    if (names.has(name)) return part.slice(separator + 1).trim();
  }
  return undefined;
}

async function deleteSessionFromDb(
  payload: Awaited<ReturnType<typeof getPayloadAuth>>,
  slug: string,
  rawCookieValue: string | undefined,
  req: PayloadRequest
) {
  if (!rawCookieValue) return;
  const [token] = rawCookieValue.split(".");
  const { docs } = await payload.find({
    collection: slug,
    where: { token: { equals: token } },
    overrideAccess: true,
    limit: 1,
    req
  });
  const session = docs.at(0);
  if (!session) return;
  try {
    await payload.delete({
      collection: slug,
      where: { id: { equals: session.id } },
      overrideAccess: true,
      req
    });
  } catch (error) {
    console.error("Failed to delete session from database during logout:", error);
  }
}
