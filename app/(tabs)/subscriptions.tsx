import SubscriptionCard from "@/components/SubscriptionCard";
import { useSubscriptions } from "@/components/SubscriptionsProvider";
import { Ionicons } from "@expo/vector-icons";
import { styled } from "nativewind";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Subscriptions = () => {
  const { subscriptions } = useSubscriptions();
  const [search, setSearch] = useState("");
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<
    string | null
  >(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const filteredSubscriptions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return subscriptions;

    return subscriptions.filter((subscription) =>
      [
        subscription.name,
        subscription.category,
        subscription.plan,
        subscription.billing,
        subscription.paymentMethod,
        subscription.status,
      ]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase().includes(query)),
    );
  }, [search, subscriptions]);

  return (
    <SafeAreaView className="flex-1  bg-background p-5">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-1">
          <View className="mb-5">
            <Text className="text-2xl font-sans-bold text-primary">
              Subscriptions
            </Text>
            <Text className="mt-1 font-sans-medium text-muted-foreground">
              Find and review your recurring payments.
            </Text>
          </View>

          <View className="mb-4 min-h-12 flex-row items-center rounded-2xl border border-border bg-card px-4">
            <Ionicons name="search" size={20} color="#52627d" />
            <TextInput
              accessibilityLabel="Search subscriptions"
              className="ml-3 min-w-0 flex-1 py-3 font-sans-medium text-primary"
              placeholder="Search subscriptions"
              placeholderTextColor="#52627d"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {search.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                className="size-8 items-center justify-center"
                onPress={() => setSearch("")}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={20} color="#52627d" />
              </Pressable>
            ) : null}
          </View>

          <Text className="mb-3 text-sm font-sans-semibold text-muted-foreground">
            {filteredSubscriptions.length}{" "}
            {filteredSubscriptions.length === 1
              ? "subscription"
              : "subscriptions"}
          </Text>

          <FlatList
            className="flex-1"
            data={filteredSubscriptions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SubscriptionCard
                {...item}
                expanded={expandedSubscriptionId === item.id}
                onPress={() =>
                  setExpandedSubscriptionId(
                    expandedSubscriptionId === item.id ? null : item.id,
                  )
                }
              />
            )}
            extraData={expandedSubscriptionId}
            ItemSeparatorComponent={() => <View className="h-4" />}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              flexGrow: filteredSubscriptions.length === 0 ? 1 : undefined,
              paddingBottom: keyboardHeight + 120,
            }}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center px-6 py-16">
                <View className="mb-4 size-14 items-center justify-center rounded-full bg-muted">
                  <Ionicons name="search" size={24} color="#52627d" />
                </View>
                <Text className="text-center text-lg font-sans-bold text-primary">
                  No subscriptions found
                </Text>
                <Text className="mt-2 text-center font-sans-medium text-muted-foreground">
                  Try another name, category, or payment detail.
                </Text>
              </View>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Subscriptions;
