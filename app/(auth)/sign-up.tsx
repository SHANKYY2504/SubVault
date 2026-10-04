import AuthField from "@/components/AuthField";
import AuthLayout from "@/components/AuthLayout";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { useAuth, useSignUp } from "@clerk/expo";
import { Link, useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUp() {
  const { isSignedIn } = useAuth();
  const { signUp, fetchStatus } = useSignUp();
  const router = useRouter();
  const posthog = usePostHog();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [formError, setFormError] = useState("");
  const isFetching = fetchStatus === "fetching";

  const startSignUp = async () => {
    const normalizedEmail = emailAddress.trim().toLowerCase();
    if (!emailPattern.test(normalizedEmail)) {
      setFormError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setFormError("Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Your passwords don't match.");
      return;
    }

    setFormError("");
    try {
      const { error } = await signUp.password({
        emailAddress: normalizedEmail,
        password,
      });
      if (error) {
        setFormError(getAuthErrorMessage(error));
        return;
      }

      const { error: verificationError } =
        await signUp.verifications.sendEmailCode();
      if (verificationError) {
        setFormError(getAuthErrorMessage(verificationError));
        return;
      }
      setIsVerifying(true);
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    }
  };

  const verifyEmail = async () => {
    if (!/^\d{6}$/.test(code.trim())) {
      setFormError("Enter the 6-digit code sent to your email.");
      return;
    }

    setFormError("");
    try {
      const { error } = await signUp.verifications.verifyEmailCode({
        code: code.trim(),
      });
      if (error) {
        setFormError(getAuthErrorMessage(error));
        return;
      }
      if (signUp.status !== "complete") {
        setFormError(
          "Your account still needs verification. Request a new code and try again.",
        );
        return;
      }

      const { error: finalizeError } = await signUp.finalize();
      if (finalizeError) {
        setFormError(getAuthErrorMessage(finalizeError));
        return;
      }
      posthog?.capture("user_signed_up");
      router.replace("/(tabs)");
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    }
  };

  const resendCode = async () => {
    setFormError("");
    try {
      const { error } = await signUp.verifications.sendEmailCode();
      if (error) setFormError(getAuthErrorMessage(error));
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    }
  };

  if (isSignedIn) return null;

  return (
    <AuthLayout
      title={isVerifying ? "Check your email" : "Create your account"}
      subtitle={
        isVerifying
          ? `Enter the code we sent to ${emailAddress.trim()}.`
          : "One simple place to stay ahead of every renewal."
      }
    >
      {isVerifying ? (
        <View className="auth-form">
          <AuthField
            label="Verification code"
            value={code}
            onChangeText={(value) => {
              setCode(value.replace(/\D/g, "").slice(0, 6));
              setFormError("");
            }}
            placeholder="6-digit code"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            returnKeyType="done"
            onSubmitEditing={verifyEmail}
          />
          {formError ? (
            <Text accessibilityRole="alert" className="auth-error">
              {formError}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            className={`auth-button${isFetching ? " auth-button-disabled" : ""}`}
            onPress={verifyEmail}
            disabled={isFetching}
          >
            {isFetching ? (
              <ActivityIndicator color="#081126" />
            ) : (
              <Text className="auth-button-text">Verify email</Text>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="auth-secondary-button"
            onPress={resendCode}
            disabled={isFetching}
          >
            <Text className="auth-secondary-button-text">Resend code</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="auth-link-row"
            onPress={async () => {
              await signUp.reset();
              setIsVerifying(false);
              setCode("");
              setFormError("");
            }}
          >
            <Text className="auth-link">Change email address</Text>
          </Pressable>
        </View>
      ) : (
        <View className="auth-form">
          <AuthField
            label="Email"
            value={emailAddress}
            onChangeText={(value) => {
              setEmailAddress(value);
              setFormError("");
            }}
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            autoCorrect={false}
            returnKeyType="next"
          />
          <AuthField
            label="Password"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setFormError("");
            }}
            placeholder="At least 8 characters"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
          />
          <AuthField
            label="Confirm password"
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              setFormError("");
            }}
            placeholder="Enter your password again"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="done"
            onSubmitEditing={startSignUp}
          />
          {formError ? (
            <Text accessibilityRole="alert" className="auth-error">
              {formError}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            className={`auth-button${isFetching ? " auth-button-disabled" : ""}`}
            onPress={startSignUp}
            disabled={isFetching}
          >
            {isFetching ? (
              <ActivityIndicator color="#081126" />
            ) : (
              <Text className="auth-button-text">Create account</Text>
            )}
          </Pressable>
          <Text className="auth-helper">
            Email verification keeps your account secure.
          </Text>
          <View nativeID="clerk-captcha" />
          <View className="auth-link-row">
            <Text className="auth-link-copy">Already have an account?</Text>
            <Link href="/(auth)/sign-in" className="auth-link">
              Sign in
            </Link>
          </View>
        </View>
      )}
    </AuthLayout>
  );
}
