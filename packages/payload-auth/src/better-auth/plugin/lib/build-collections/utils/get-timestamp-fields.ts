import type { Field } from "payload";

export function getTimestampFields(): Field[] {
  return [
    {
      name: "updatedAt",
      type: "date",
      admin: {
        hidden: true
      },
      label: ({ t }) => t("general:updatedAt")
    },
    {
      name: "createdAt",
      admin: {
        hidden: true
      },
      type: "date",
      label: ({ t }) => t("general:createdAt")
    }
  ];
}
