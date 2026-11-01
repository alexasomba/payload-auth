import {
  type CollectionBeforeDeleteHook,
  commitTransaction,
  initTransaction,
  killTransaction
} from "payload";
import { baModelKey } from "@/better-auth/plugin/constants";

export function getBeforeDeleteHook(): CollectionBeforeDeleteHook {
  const hook: CollectionBeforeDeleteHook = async ({ req, id }) => {
    const collections = req.payload.collections;

    /**
     * Resolves the slug for a model key, returning null if the collection
     * doesn't exist (e.g. optional plugin collections like passkeys, twoFactor).
     */
    function getSlugSafe(modelKey: string): string | null {
      const collection = Object.values(collections).find(
        (c) =>
          c.config?.custom?.betterAuthModelKey === modelKey ||
          c.config?.slug === modelKey
      );
      return collection?.config?.slug ?? null;
    }

    function mappedField(slug: string, key: string, fallback: string) {
      const fields = collections[slug]?.config?.fields ?? [];
      const field = fields.find((item) => item.custom?.betterAuthFieldKey === key);
      return field && "name" in field ? field.name : fallback;
    }

    try {
      const { payload } = req;
      const userId = id;

      const shouldCommit = await initTransaction(req);

      // Core collections (always exist)
      const coreModels = [
        baModelKey.account,
        baModelKey.session
      ] as const;

      for (const modelKey of coreModels) {
        const slug = getSlugSafe(modelKey);
        if (slug) {
          await payload.delete({
            collection: slug,
            where: { [mappedField(slug, "userId", "user")]: { equals: userId } },
            overrideAccess: true,
            req
          });
        }
      }

      // Verifications: use contains with JSON-quoted userId to avoid
      // substring collisions (e.g. userId "1" matching "10", "12", etc.)
      const verificationsSlug = getSlugSafe(baModelKey.verification);
      if (verificationsSlug) {
        await payload.delete({
          collection: verificationsSlug,
          where: { value: { contains: `"${userId}"` } },
          overrideAccess: true,
          req
        });
      }

      // Optional plugin collections — only delete if the collection exists
      const optionalUserModels = [
        baModelKey.passkey,
        baModelKey.twoFactor,
        baModelKey.ssoProvider,
        baModelKey.oauthApplication,
        baModelKey.oauthAccessToken,
        baModelKey.oauthConsent
      ] as const;

      for (const modelKey of optionalUserModels) {
        const slug = getSlugSafe(modelKey);
        if (slug) {
          await payload.delete({
            collection: slug,
            where: { [mappedField(slug, "userId", "user")]: { equals: userId } },
            overrideAccess: true,
            req
          });
        }
      }

      // API keys use referenceId instead of userId (can reference user or org)
      const apikeySlug = getSlugSafe(baModelKey.apikey);
      if (apikeySlug) {
        await payload.delete({
          collection: apikeySlug,
          where: { referenceId: { equals: String(userId) } },
          overrideAccess: true,
          req
        });
      }

      // Organization plugin: members and invitations reference user
      const membersSlug = getSlugSafe(baModelKey.member);
      if (membersSlug) {
        await payload.delete({
          collection: membersSlug,
          where: { [mappedField(membersSlug, "userId", "user")]: { equals: userId } },
          overrideAccess: true,
          req
        });
      }

      const invitationsSlug = getSlugSafe(baModelKey.invitation);
      if (invitationsSlug) {
        await payload.delete({
          collection: invitationsSlug,
          where: { [mappedField(invitationsSlug, "inviterId", "inviter")]: { equals: userId } },
          overrideAccess: true,
          req
        });
      }

      if (shouldCommit) {
        await commitTransaction(req);
      }

      return;
    } catch (error) {
      await killTransaction(req);
      console.error("Error in user beforeDelete hook:", error);
      throw error;
    }
  };

  return hook;
}
