import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPayloadAuth } = vi.hoisted(() => ({
  mockPayloadAuth: {
    betterAuth: {
      $context: Promise.resolve({
        authCookies: { sessionToken: { name: "better-auth.session_token" } }
      })
    },
    find: vi.fn().mockResolvedValue({ docs: [] }),
    delete: vi.fn().mockResolvedValue({ docs: [] })
  }
}));

vi.mock("@/better-auth/plugin/lib/get-payload-auth", () => ({
  getPayloadAuth: vi.fn().mockResolvedValue(mockPayloadAuth)
}));

vi.mock("@/better-auth/plugin/helpers/get-collection", () => ({
  getCollectionByModelKey: vi.fn().mockReturnValue({ slug: "sessions" })
}));

import { getAfterLogoutHook } from "../../plugin/lib/build-collections/users/hooks/after-logout";

describe("getAfterLogoutHook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPayloadAuth.find.mockResolvedValue({ docs: [] });
    mockPayloadAuth.delete.mockResolvedValue({ docs: [] });
  });

  it("revokes the Better Auth session from the request cookie", async () => {
    mockPayloadAuth.find.mockResolvedValue({
      docs: [{ id: "session-1", token: "session-token-value" }]
    });

    const hook = getAfterLogoutHook();
    await hook({
      req: {
        headers: new Headers({
          cookie: "other=value; better-auth.session_token=session-token-value.signature"
        }),
        payload: { config: {}, collections: {} }
      }
    } as any);

    expect(mockPayloadAuth.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "sessions",
        overrideAccess: true,
        where: { token: { equals: "session-token-value" } }
      })
    );
    expect(mockPayloadAuth.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "sessions",
        overrideAccess: true,
        where: { id: { equals: "session-1" } }
      })
    );
  });

  it("recognizes the secure-prefixed session cookie", async () => {
    mockPayloadAuth.find.mockResolvedValue({
      docs: [{ id: "session-2", token: "secure-token" }]
    });

    const hook = getAfterLogoutHook();
    await hook({
      req: {
        headers: new Headers({
          cookie: "__Secure-better-auth.session_token=secure-token.signature"
        }),
        payload: { config: {}, collections: {} }
      }
    } as any);

    expect(mockPayloadAuth.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { token: { equals: "secure-token" } }
      })
    );
  });

  it("does nothing when the request has no Better Auth cookie", async () => {
    const hook = getAfterLogoutHook();
    await hook({
      req: {
        headers: new Headers({ cookie: "other=value" }),
        payload: { config: {}, collections: {} }
      }
    } as any);

    expect(mockPayloadAuth.find).not.toHaveBeenCalled();
    expect(mockPayloadAuth.delete).not.toHaveBeenCalled();
  });

  it("does nothing for native logout when Better Auth initialization is deferred", async () => {
    const auth = mockPayloadAuth.betterAuth;
    Object.assign(mockPayloadAuth, { betterAuth: undefined });
    try {
      await expect(getAfterLogoutHook()({ req: { payload: { config: {}, collections: {} }, headers: new Headers() } } as any)).resolves.toBeUndefined();
      expect(mockPayloadAuth.find).not.toHaveBeenCalled();
    } finally {
      Object.assign(mockPayloadAuth, { betterAuth: auth });
    }
  });

  it("does not fail logout when deleting a session fails", async () => {
    mockPayloadAuth.find.mockResolvedValue({ docs: [{ id: "session-3" }] });
    mockPayloadAuth.delete.mockRejectedValue(new Error("database unavailable"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const hook = getAfterLogoutHook();
    await expect(
      hook({
        req: {
          headers: new Headers({
            cookie: "better-auth.session_token=revoked-token.signature"
          }),
          payload: { config: {}, collections: {} }
        }
      } as any)
    ).resolves.toBeUndefined();

    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
