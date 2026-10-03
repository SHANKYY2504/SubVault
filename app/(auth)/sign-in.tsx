import AuthField from "@/components/AuthField";
import AuthLayout from "@/components/AuthLayout";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { useAuth, useSignIn } from "@clerk/expo";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type SignInMode = "credentials" | "mfa" | "reset-code" | "reset-password";
type Factor = "email_code" | "phone_code" | "totp" | "backup_code";

export default function SignIn() {
  const { isSignedIn } = useAuth();
  const { signIn, fetchStatus } = useSignIn();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<SignInMode>("credentials");
  const [factor, setFactor] = useState<Factor>("email_code");
  const [formError, setFormError] = useState("");
  const isFetching = fetchStatus === "fetching";

  const finishSignIn = async () => {
    const { error } = await signIn.finalize();
    if (error) {
      setFormError(getAuthErrorMessage(error));
      return;
    }
    router.replace("/(tabs)");
  };

  const availableFactors = (): Factor[] =>
    signIn.supportedSecondFactors
      .map((item) => item.strategy)
      .filter(
        (strategy): strategy is Factor =>
          strategy === "email_code" ||
          strategy === "phone_code" ||
          strategy === "totp" ||
          strategy === "backup_code",
      );

  const selectFactor = async (nextFactor: Factor) => {
    setFactor(nextFactor);
    setCode("");
    setFormError("");
    try {
      const result =
        nextFactor === "email_code"
          ? await signIn.mfa.sendEmailCode()
          : nextFactor === "phone_code"
            ? await signIn.mfa.sendPhoneCode()
            : { error: null };
      if (result.error) setFormError(getAuthErrorMessage(result.error));
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    }
  };

  const beginVerification = async (deviceTrust: boolean) => {
    const factors = availableFactors();
    const preferredFactor = deviceTrust
      ? factors.find((item) => item === "email_code" || item === "phone_code")
      : factors[0];
    if (!preferredFactor) {
      setFormError(
        "No supported verification method is available. Contact support to continue.",
      );
      return;
    }
    setMode("mfa");
    await selectFactor(preferredFactor);
  };

  const submitCredentials = async () => {
    const normalizedEmail = emailAddress.trim().toLowerCase();
    if (!emailPattern.test(normalizedEmail)) {
      setFormError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setFormError("Enter your password.");
      return;
    }

    setFormError("");
    try {
      const { error } = await signIn.password({
        emailAddress: normalizedEmail,
        password,
      });
      if (error) {
        setFormError(getAuthErrorMessage(error));
        return;
      }
      if (signIn.status === "complete") {
        await finishSignIn();
      } else if (signIn.status === "needs_second_factor") {
        await beginVerification(false);
      } else if (signIn.status === "needs_client_trust") {
        await beginVerification(true);
      } else if (signIn.status !== "needs_first_factor") {
        setFormError(
          "We couldn't complete sign in. Please check your details and try again.",
        );
      }
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    }
  };

  const verifyFactor = async () => {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setFormError("Enter the verification code to continue.");
      return;
    }

    setFormError("");
    try {
      const result =
        factor === "email_code"
          ? await signIn.mfa.verifyEmailCode({ code: trimmedCode })
          : factor === "phone_code"
            ? await signIn.mfa.verifyPhoneCode({ code: trimmedCode })
            : factor === "totp"
              ? await signIn.mfa.verifyTOTP({ code: trimmedCode })
              : await signIn.mfa.verifyBackupCode({ code: trimmedCode });
      if (result.error) {
        setFormError(getAuthErrorMessage(result.error));
        return;
      }
      if (signIn.status === "complete") await finishSignIn();
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    }
  };

  const sendResetCode = async () => {
    const normalizedEmail = emailAddress.trim().toLowerCase();
    if (!emailPattern.test(normalizedEmail)) {
      setFormError("Enter the email address associated with your account.");
      return;
    }

    setFormError("");
    try {
      const { error } = await signIn.create({ identifier: normalizedEmail });
      if (error) {
        setFormError(getAuthErrorMessage(error));
        return;
      }
      const { error: sendError } =
        await signIn.resetPasswordEmailCode.sendCode();
      if (sendError) {
        setFormError(getAuthErrorMessage(sendError));
        return;
      }
      setMode("reset-code");
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    }
  };

  const verifyResetCode = async () => {
    if (!code.trim()) {
      setFormError("Enter the code sent to your email.");
      return;
    }
    setFormError("");
    try {
      const { error } = await signIn.resetPasswordEmailCode.verifyCode({
        code: code.trim(),
      });
      if (error) {
        setFormError(getAuthErrorMessage(error));
        return;
      }
      if (signIn.status === "needs_new_password") setMode("reset-password");
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    }
  };

  const submitNewPassword = async () => {
    if (newPassword.length < 8) {
      setFormError("Use a password with at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("Your passwords don't match.");
      return;
    }
    setFormError("");
    try {
      const { error } = await signIn.resetPasswordEmailCode.submitPassword({
        password: newPassword,
      });
      if (error) {
        setFormError(getAuthErrorMessage(error));
        return;
      }
      if (signIn.status === "complete") await finishSignIn();
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    }
  };

  const startOver = async () => {
    await signIn.reset();
    setMode("credentials");
    setCode("");
    setFormError("");
  };

  if (isSignedIn) return null;

  const isReset = mode === "reset-code" || mode === "reset-password";
  const title =
    mode === "mfa"
      ? "Verify it's you"
      : mode === "reset-code"
        ? "Check your email"
        : mode === "reset-password"
          ? "Choose a new password"
          : "Welcome back";
  const subtitle =
    mode === "mfa"
      ? "Complete a quick security check to protect your account."
      : mode === "reset-code"
        ? `Enter the password reset code sent to ${emailAddress.trim()}.`
        : mode === "reset-password"
          ? "Choose a strong password you haven’t used before."
          : "Sign in to stay in control of your subscriptions.";

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      <View className="auth-form">
        {mode === "credentials" ? (
          <>
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
              placeholder="Enter your password"
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={submitCredentials}
            />
            <Pressable
              accessibilityRole="button"
              className="self-end py-1"
              onPress={() => void sendResetCode()}
            >
              <Text className="auth-link">Forgot password?</Text>
            </Pressable>
          </>
        ) : null}

        {mode === "mfa" ? (
          <>
            {availableFactors().length > 1 ? (
              <View className="picker-row">
                {availableFactors().map((item) => (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected: factor === item }}
                    className={`picker-option${factor === item ? " picker-option-active" : ""}`}
                    onPress={() => void selectFactor(item)}
                  >
                    <Text
                      className={`picker-option-text${factor === item ? " picker-option-text-active" : ""}`}
                    >
                      {item === "email_code"
                        ? "Email code"
                        : item === "phone_code"
                          ? "Text message"
                          : item === "totp"
                            ? "Authenticator"
                            : "Backup code"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <AuthField
              label={
                factor === "backup_code" ? "Backup code" : "Verification code"
              }
              value={code}
              onChangeText={(value) => {
                setCode(value);
                setFormError("");
              }}
              placeholder={
                factor === "backup_code"
                  ? "Enter a backup code"
                  : "Enter your code"
              }
              keyboardType={factor === "backup_code" ? "default" : "number-pad"}
              autoCapitalize="none"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              returnKeyType="done"
              onSubmitEditing={verifyFactor}
            />
          </>
        ) : null}

        {mode === "reset-code" ? (
          <AuthField
            label="Password reset code"
            value={code}
            onChangeText={(value) => {
              setCode(value);
              setFormError("");
            }}
            placeholder="Enter the code from your email"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            returnKeyType="done"
            onSubmitEditing={verifyResetCode}
          />
        ) : null}

        {mode === "reset-password" ? (
          <>
            <AuthField
              label="New password"
              value={newPassword}
              onChangeText={(value) => {
                setNewPassword(value);
                setFormError("");
              }}
              placeholder="At least 8 characters"
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
            />
            <AuthField
              label="Confirm new password"
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                setFormError("");
              }}
              placeholder="Enter your new password again"
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={submitNewPassword}
            />
          </>
        ) : null}

        {formError ? (
          <Text accessibilityRole="alert" className="auth-error">
            {formError}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          className={`auth-button${isFetching ? " auth-button-disabled" : ""}`}
          onPress={
            mode === "credentials"
              ? submitCredentials
              : mode === "mfa"
                ? verifyFactor
                : mode === "reset-code"
                  ? verifyResetCode
                  : submitNewPassword
          }
          disabled={isFetching}
        >
          {isFetching ? (
            <ActivityIndicator color="#081126" />
          ) : (
            <Text className="auth-button-text">
              {mode === "credentials"
                ? "Sign in"
                : mode === "mfa"
                  ? "Verify and continue"
                  : mode === "reset-code"
                    ? "Verify code"
                    : "Update password"}
            </Text>
          )}
        </Pressable>

        {mode === "credentials" ? (
          <View className="auth-link-row">
            <Text className="auth-link-copy">New to SubVault?</Text>
            <Link href="/(auth)/sign-up" className="auth-link">
              Create an account
            </Link>
          </View>
        ) : null}

        {mode === "mfa" &&
        (factor === "email_code" || factor === "phone_code") ? (
          <Pressable
            accessibilityRole="button"
            className="auth-secondary-button"
            onPress={() => void selectFactor(factor)}
            disabled={isFetching}
          >
            <Text className="auth-secondary-button-text">Send a new code</Text>
          </Pressable>
        ) : null}

        {isReset && mode === "reset-code" ? (
          <Pressable
            accessibilityRole="button"
            className="auth-secondary-button"
            onPress={sendResetCode}
            disabled={isFetching}
          >
            <Text className="auth-secondary-button-text">
              Resend reset code
            </Text>
          </Pressable>
        ) : null}

        {mode !== "credentials" ? (
          <Pressable
            accessibilityRole="button"
            className="auth-link-row"
            onPress={startOver}
            disabled={isFetching}
          >
            <Text className="auth-link">Back to sign in</Text>
          </Pressable>
        ) : null}

        <View className="auth-divider-row">
          <View className="auth-divider-line" />
          <Text className="auth-helper">Your account details stay private</Text>
          <View className="auth-divider-line" />
        </View>
      </View>
    </AuthLayout>
  );
}
