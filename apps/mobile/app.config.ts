// Extends app.json. Registers Google's reversed iOS client ID as a URL scheme so sign-in can return to the app.
import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const iosClient = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const google = iosClient ? [iosClient.split('.').reverse().join('.')] : [];
  return { ...config, name: config.name!, slug: config.slug!, scheme: [config.scheme as string, ...google],
    // GitHub Pages serves the PWA under /<repo>/. Unset locally, so dev and local builds stay at /.
    experiments: { ...config.experiments, baseUrl: process.env.EXPO_BASE_URL } };
};
