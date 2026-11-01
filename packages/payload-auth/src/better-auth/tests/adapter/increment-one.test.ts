import type { BetterAuthOptions } from "better-auth";
import { describe, expect, it } from "vitest";
import { payloadAdapter } from "../../adapter";

function matchesWhere(document: Record<string, unknown>, where: any): boolean {
  if (where.and) return where.and.every((condition: any) => matchesWhere(document, condition));
  if (where.or) return where.or.some((condition: any) => matchesWhere(document, condition));

  return Object.entries(where).every(([field, condition]: [string, any]) => {
    if (field === "and" || field === "or") return true;
    if (condition?.equals !== undefined) return document[field] === condition.equals;
    if (condition?.exists !== undefined)
      return (document[field] !== undefined) === condition.exists;
    return document[field] === condition;
  });
}

describe("Adapter incrementOne", () => {
  it("retries a compare-and-swap conflict instead of losing a concurrent increment", async () => {
    const current = {
      id: "verification-1",
      identifier: "otp:customer@example.test",
      failedAttempts: 0
    };
    let initialReads = 0;
    let releaseInitialReads!: () => void;
    const bothInitialReads = new Promise<void>((resolve) => {
      releaseInitialReads = resolve;
    });

    const payload = {
      config: { custom: {} },
      collections: {
        verifications: {
          config: {
            slug: "verifications",
            custom: { betterAuthModelKey: "verification" },
            fields: [
              { name: "identifier", type: "text" },
              { name: "failedAttempts", type: "number" }
            ]
          }
        }
      },
      async find({ where }: { where: any }) {
        const snapshot = { ...current };
        initialReads += 1;
        if (initialReads === 2) releaseInitialReads();
        if (initialReads <= 2) await bothInitialReads;
        return { docs: matchesWhere(snapshot, where) ? [snapshot] : [] };
      },
      async update({ where, data }: { where: any; data: Record<string, unknown> }) {
        if (!matchesWhere(current, where)) return { docs: [] };
        Object.assign(current, data);
        return { docs: [{ ...current }] };
      }
    };

    const adapter = payloadAdapter({
      payloadClient: payload as any,
      adapterConfig: { idType: "text" }
    })({
      verification: { modelName: "verifications" }
    } as BetterAuthOptions);

    const results = await Promise.all([
      adapter.incrementOne({
        model: "verification",
        where: [{ field: "identifier", value: current.identifier }],
        increment: { failedAttempts: 1 }
      }),
      adapter.incrementOne({
        model: "verification",
        where: [{ field: "identifier", value: current.identifier }],
        increment: { failedAttempts: 1 }
      })
    ]);

    expect(current.failedAttempts).toBe(2);
    expect(results).toHaveLength(2);
    expect(results.every(Boolean)).toBe(true);
  });
});
