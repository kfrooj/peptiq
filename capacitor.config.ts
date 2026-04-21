import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "uk.peptiq.app",
  appName: "PEPT|IQ",
  webDir: "out",
  server: {
    url: "https://peptiq.uk",
    cleartext: false,
  },
};

export default config;