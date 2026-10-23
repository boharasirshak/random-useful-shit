// Extends app.json. Registers Google's reversed iOS client ID as a URL scheme so sign-in can return to the app.
// APP_VARIANT=development makes a separate "Dev" app (own bundle ID, name and scheme) that installs next to the real one.
import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const iosClient = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const google = iosClient ? [iosClient.split('.').reverse().join('.')] : [];
  const dev = process.env.APP_VARIANT === 'development';
  const id = (base?: string) => (dev ? `${base}.dev` : base);
  // `name` stays fixed: it names the Xcode project, and changing it makes prebuild throw away Pods and the build cache.
  return { ...config, name: config.name!, slug: config.slug!,
    scheme: [dev ? `${config.scheme}-dev` : (config.scheme as string), ...google],
    ios: { ...config.ios, bundleIdentifier: id(config.ios?.bundleIdentifier),
      infoPlist: { ...config.ios?.infoPlist, ...(dev && { CFBundleDisplayName: 'Useful Shit Dev' }) } },
    android: { ...config.android, package: id(config.android?.package) },
    // GitHub Pages serves the PWA under /<repo>/. Unset locally, so dev and local builds stay at /.
    experiments: { ...config.experiments, baseUrl: process.env.EXPO_BASE_URL } };
};
