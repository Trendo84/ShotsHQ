import { task } from "@trigger.dev/sdk/v3";

type Payload = {
  userId: string;
  projectId: string;
  device: "iphone_69" | "iphone_67" | "ipad_13";
  locales: string[];
  ascAppId: string;
  ascIssuerId: string;
  ascKeyId: string;
  ascPrivateKey: string;
};

/**
 * App Store Connect direct upload. Out of scope for v1 scaffold — the
 * task signature is locked but the JWT signing + multipart upload is
 * provided by `@expo/apple-utils` or hand-rolled per Apple's docs.
 */
export const uploadToAppStore = task({
  id: "upload-to-app-store",
  maxDuration: 600,
  run: async (_payload: Payload) => {
    throw new Error("App Store Connect upload not yet implemented in scaffold.");
  },
});
