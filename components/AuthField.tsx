import type { TextInputProps } from "react-native";
import { Text, TextInput, View } from "react-native";

type AuthFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export default function AuthField({
  label,
  error,
  ...inputProps
}: AuthFieldProps) {
  return (
    <View className="auth-field">
      <Text className="auth-label">{label}</Text>
      <TextInput
        {...inputProps}
        accessibilityLabel={label}
        className={`auth-input${error ? " auth-input-error" : ""}`}
        placeholderTextColor="#52627d"
      />
      {error ? <Text className="auth-error">{error}</Text> : null}
    </View>
  );
}
