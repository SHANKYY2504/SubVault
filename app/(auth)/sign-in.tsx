import { Link } from "expo-router";
import { Text, View } from "react-native";

const SignIn = () => {
  return (
    <View>
      <Text> SignIn </Text>
      <Link href="/(auth)/sign-up"> Create account</Link>
      <Link href="/"> go back</Link>
    </View>
  );
};

export default SignIn;
