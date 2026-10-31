import { describe, expect, it } from "vitest";
import { applyBetterAuthAdminConfig } from "../../plugin/lib/apply-ba-admin-config";

describe("Payload admin UI option", () => {
  it("leaves host-framework admin views untouched when disabled", () => {
    const config = {
      admin: {
        routes: { login: "/admin/login" },
        components: { views: { login: { Component: "~/auth/StaffLogin" } } }
      }
    };

    applyBetterAuthAdminConfig({
      config: config as any,
      pluginOptions: { admin: { enabled: false } },
      collectionMap: {},
      resolvedBetterAuthSchemas: {}
    });

    expect(config.admin.routes.login).toBe("/admin/login");
    expect(config.admin.components.views.login.Component).toBe(
      "~/auth/StaffLogin"
    );
  });
});
