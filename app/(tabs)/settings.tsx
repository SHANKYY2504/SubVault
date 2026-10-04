import { getAuthErrorMessage } from "@/lib/auth-errors";
import { useClerk, useUser } from "@clerk/expo";
import { router } from "expo-router";
import { styled } from "nativewind";
import { usePostHog } from "posthog-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
  const { signOut } = useClerk();
  const { user } = useUser();
  const posthog = usePostHog();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState("");

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setError("");
    try {
      await signOut();
      posthog?.capture("user_signed_out");
      posthog?.reset();
      router.replace("/(auth)/sign-in");
    } catch (signOutError) {
      setError(getAuthErrorMessage(signOutError));
      setIsSigningOut(false);
    }
  };

  return (
    <SafeAreaView className="flex-1  bg-background p-5">
      <Text className="text-2xl font-sans-bold text-primary">Account</Text>
      <View className="mt-6 rounded-2xl border border-border bg-card p-5">
        <Text className="font-sans-semibold text-primary">
          {user?.fullName || "Your account"}
        </Text>
        <Text className="mt-1 font-sans-medium text-muted-foreground">
          {user?.primaryEmailAddress?.emailAddress}
        </Text>
      </View>
      {error ? (
        <Text
          accessibilityRole="alert"
          className="mt-4 text-sm text-destructive"
        >
          {error}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        className={`mt-6 items-center rounded-2xl bg-primary py-4${isSigningOut ? " opacity-50" : ""}`}
        onPress={handleSignOut}
        disabled={isSigningOut}
      >
        {isSigningOut ? (
          <ActivityIndicator color="#fff9e3" />
        ) : (
          <Text className="font-sans-bold text-background">Log out</Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
};

export default Settings;
