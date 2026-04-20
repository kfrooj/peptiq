import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uk.peptiq.app',
  appName: 'PEPT|IQ',
  webDir: 'public',
  server: {
    url: 'https://peptiq.uk',
    cleartext: false
  }
};

export default config;