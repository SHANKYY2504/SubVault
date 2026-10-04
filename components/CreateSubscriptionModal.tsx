import { icons } from "@/constants/icons";
import clsx from "clsx";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const categories = [
  "Entertainment",
  "AI Tools",
  "Developer Tools",
  "Design",
  "Productivity",
  "Cloud",
  "Music",
  "Other",
] as const;

const categoryColors: Record<(typeof categories)[number], string> = {
  Entertainment: "#f2b8a0",
  "AI Tools": "#b8d4e3",
  "Developer Tools": "#e8def8",
  Design: "#f5c542",
  Productivity: "#b8e8d0",
  Cloud: "#a8d8ea",
  Music: "#f4c2c2",
  Other: "#d9d6c8",
};

type Frequency = "Monthly" | "Yearly";

type CreateSubscriptionModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreate: (subscription: Subscription) => void;
};

export default function CreateSubscriptionModal({
  visible,
  onClose,
  onCreate,
}: CreateSubscriptionModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("Monthly");
  const [category, setCategory] =
    useState<(typeof categories)[number]>("Other");
  const [formError, setFormError] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const resetForm = () => {
    setName("");
    setPrice("");
    setFrequency("Monthly");
    setCategory("Other");
    setFormError("");
  };

  const closeModal = () => {
    Keyboard.dismiss();
    resetForm();
    onClose();
  };

  const handleCreate = () => {
    const normalizedName = name.trim();
    const normalizedPrice = Number(price.trim().replace(",", "."));

    if (!normalizedName) {
      setFormError("Enter a subscription name.");
      return;
    }
    if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
      setFormError("Enter a price greater than zero.");
      return;
    }

    const startDate = dayjs();
    const renewalDate = startDate
      .add(1, frequency === "Monthly" ? "month" : "year")
      .toISOString();
    const subscription: Subscription = {
      id: `subscription-${Date.now()}`,
      name: normalizedName,
      price: normalizedPrice,
      currency: "USD",
      billing: frequency,
      category,
      status: "active",
      startDate: startDate.toISOString(),
      renewalDate,
      icon: icons.wallet,
      color: categoryColors[category],
    };

    Keyboard.dismiss();
    onCreate(subscription);
    resetForm();
    onClose();
  };

  const hasValidPrice =
    price.trim().length > 0 &&
    Number.isFinite(Number(price.trim().replace(",", "."))) &&
    Number(price.trim().replace(",", ".")) > 0;
  const isValid = Boolean(name.trim()) && hasValidPrice;

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={closeModal}
      statusBarTranslucent
    >
      <View className="modal-overlay justify-end">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className={clsx("w-full", keyboardVisible && "flex-1")}
        >
          <View
            className={clsx(
              "modal-container",
              keyboardVisible && "modal-container-fullscreen",
            )}
          >
            <View
              className="modal-header"
              style={
                keyboardVisible
                  ? { paddingTop: Math.max(insets.top, 16) }
                  : undefined
              }
            >
              <Text className="modal-title">New Subscription</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close new subscription form"
                className="modal-close"
                onPress={closeModal}
                hitSlop={8}
              >
                <Text className="modal-close-text">×</Text>
              </Pressable>
            </View>

            <ScrollView
              className={keyboardVisible ? "flex-1" : undefined}
              keyboardShouldPersistTaps="handled"
              contentContainerClassName="modal-body"
              showsVerticalScrollIndicator={false}
            >
              <View className="auth-field">
                <Text className="auth-label">Name</Text>
                <TextInput
                  accessibilityLabel="Subscription name"
                  className="auth-input"
                  value={name}
                  onChangeText={(value) => {
                    setName(value);
                    setFormError("");
                  }}
                  placeholder="e.g. Netflix"
                  placeholderTextColor="#52627d"
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>

              <View className="auth-field">
                <Text className="auth-label">Price</Text>
                <TextInput
                  accessibilityLabel="Subscription price"
                  className="auth-input"
                  value={price}
                  onChangeText={(value) => {
                    setPrice(value.replace(/[^\d.,]/g, ""));
                    setFormError("");
                  }}
                  placeholder="0.00"
                  placeholderTextColor="#52627d"
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
              </View>

              <View className="auth-field">
                <Text className="auth-label">Frequency</Text>
                <View className="picker-row">
                  {(["Monthly", "Yearly"] as const).map((option) => (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      accessibilityState={{ selected: frequency === option }}
                      className={clsx(
                        "picker-option",
                        frequency === option && "picker-option-active",
                      )}
                      onPress={() => setFrequency(option)}
                    >
                      <Text
                        className={clsx(
                          "picker-option-text",
                          frequency === option && "picker-option-text-active",
                        )}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="auth-field">
                <Text className="auth-label">Category</Text>
                <View className="category-scroll">
                  {categories.map((option) => (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      accessibilityState={{ selected: category === option }}
                      className={clsx(
                        "category-chip",
                        category === option && "category-chip-active",
                      )}
                      onPress={() => setCategory(option)}
                    >
                      <Text
                        className={clsx(
                          "category-chip-text",
                          category === option && "category-chip-text-active",
                        )}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {formError ? (
                <Text accessibilityRole="alert" className="auth-error">
                  {formError}
                </Text>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !isValid }}
                className={clsx(
                  "auth-button",
                  !isValid && "auth-button-disabled",
                )}
                onPress={handleCreate}
              >
                <Text className="auth-button-text">Add subscription</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
