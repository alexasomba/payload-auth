import type { Access, PayloadRequest } from "payload";

export type AdminRolesConfig = {
  adminRoles?: string[];
};

export type AdminOrCurrentUserConfig = AdminRolesConfig & {
  idField?: string;
};

export type AdminOrCurrentUserUpdateConfig = AdminOrCurrentUserConfig & {
  allowedFields?: string[];
  userSlug: string;
};

export const isAdminWithRoles =
  (config: AdminRolesConfig = {}): Access =>
  ({ req }) => {
    const { adminRoles = ["admin"] } = config;
    return !!req?.user && hasAdminRoles(adminRoles)({ req });
  };

export const isAdminOrCurrentUserWithRoles =
  (config: AdminOrCurrentUserConfig = {}): Access =>
  ({ req }) => {
    const { adminRoles = ["admin"], idField = "id" } = config;
    if (hasAdminRoles(adminRoles)({ req })) return true;
    if (!req?.user) return false;
    return {
      [idField]: {
        equals: req?.user?.id
      }
    };
  };

export const hasAdminRoles = (adminRoles: string[]) => {
  return ({ req }: { req: PayloadRequest }): boolean => {
    let userRoles: string[] = [];
    const user = req.user as
      | (typeof req.user & { role?: unknown; roles?: unknown })
      | null
      | undefined;
    const roleValue = user?.roles ?? user?.role;
    if (Array.isArray(roleValue)) {
      userRoles = roleValue.filter(
        (role): role is string => typeof role === "string"
      );
    } else if (typeof roleValue === "string") {
      if (roleValue.includes(",")) {
        userRoles = roleValue
          .split(",")
          .map((r: string) => r.trim())
          .filter(Boolean);
      } else if (roleValue) {
        userRoles = [roleValue];
      }
    }
    return userRoles.some((role) => adminRoles.includes(role));
  };
};

export const isAdminOrCurrentUserUpdateWithAllowedFields = (
  config: AdminOrCurrentUserUpdateConfig
): Access => {
  return async ({ req, id, data }) => {
    const {
      adminRoles = ["admin"],
      allowedFields = [],
      userSlug,
      idField = "id"
    } = config;
    const user = req.user;

    if (hasAdminRoles(adminRoles)({ req })) return true;

    if (!user) return false;

    if ((user as Record<string, unknown>)[idField] === id && data) {
      const dataKeys = Object.keys(data);
      let effectiveAllowedFields = allowedFields;

      const hasCurrentPassword = dataKeys.includes("currentPassword");
      const hasPassword = dataKeys.includes("password");

      if (hasPassword || hasCurrentPassword) {
        if (!(hasCurrentPassword && hasPassword)) return false;
        try {
          if (!user.email) return false;

          const result = await req.payload.login({
            collection: userSlug,
            data: {
              email: user.email,
              password: data.currentPassword
            }
          });

          if (!result) return false;

          effectiveAllowedFields = [...allowedFields, "password", "currentPassword"];
        } catch (error) {
          return false;
        }
      }

      const hasDisallowedField = dataKeys.some(
        (key) => !effectiveAllowedFields.includes(key)
      );

      return !hasDisallowedField;
    }

    return false;
  };
};
