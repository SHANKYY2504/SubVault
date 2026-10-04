import Constants from "expo-constants";
import PostHog from "posthog-react-native";

const extra = Constants.expoConfig?.extra as
  | {
      posthogProjectToken?: string;
      posthogHost?: string;
    }
  | undefined;

const projectToken = extra?.posthogProjectToken;
const host = extra?.posthogHost;

if (__DEV__ && !projectToken) {
  throw new Error(
    "EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN is configured",
  );
}

if (__DEV__ && !host) {
  throw new Error(
    "EXPO_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once EXPO_PUBLIC_POSTHOG_HOST is configured",
  );
}

export const isPostHogConfigured = Boolean(projectToken && host);

export const posthog = isPostHogConfigured
  ? new PostHog(projectToken!, {
      host: host!,
      captureAppLifecycleEvents: true,
      errorTracking: {
        autocapture: {
          uncaughtExceptions: true,
          unhandledRejections: true,
          console: [],
        },
      },
      debug: __DEV__,
    })
  : undefined;
