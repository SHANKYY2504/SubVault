import { HOME_SUBSCRIPTIONS } from "@/constants/data";
import { createContext, useContext, useState, type ReactNode } from "react";

type SubscriptionsContextValue = {
  subscriptions: Subscription[];
  addSubscription: (subscription: Subscription) => void;
};

const SubscriptionsContext = createContext<
  SubscriptionsContextValue | undefined
>(undefined);

type SubscriptionsProviderProps = {
  children: ReactNode;
};

const fallbackColors = [
  "#ffcdb2",
  "#ffb4a2",
  "#e5989b",
  "#b5838d",
  "#b8d8ba",
  "#d0f4de",
  "#a9def9",
  "#e4c1f9",
  "#fcf6bd",
  "#f1c0e8",
  "#a2d2ff",
  "#f4a261",
  "#84a59d",
  "#e9c46a",
];

function hslToHex(hue: number, saturation: number, lightness: number) {
  const chroma = ((1 - Math.abs((2 * lightness) / 100 - 1)) * saturation) / 100;
  const hueSection = hue / 60;
  const secondary = chroma * (1 - Math.abs((hueSection % 2) - 1));
  const lightnessOffset = lightness / 100 - chroma / 2;
  const channels =
    hueSection < 1
      ? [chroma, secondary, 0]
      : hueSection < 2
        ? [secondary, chroma, 0]
        : hueSection < 3
          ? [0, chroma, secondary]
          : hueSection < 4
            ? [0, secondary, chroma]
            : hueSection < 5
              ? [secondary, 0, chroma]
              : [chroma, 0, secondary];

  return `#${channels
    .map((channel) =>
      Math.round((channel + lightnessOffset) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function getUniqueColor(
  preferredColor: string | undefined,
  usedColors: Set<string>,
) {
  if (preferredColor && !usedColors.has(preferredColor.toLowerCase())) {
    return preferredColor;
  }

  const availableFallback = fallbackColors.find(
    (color) => !usedColors.has(color),
  );
  if (availableFallback) return availableFallback;

  for (const lightness of [84, 78, 72, 88]) {
    for (const saturation of [52, 64, 76, 88]) {
      for (let hue = 0; hue < 360; hue += 1) {
        const color = hslToHex(hue, saturation, lightness);
        if (!usedColors.has(color)) return color;
      }
    }
  }

  for (let value = 0; value < 96 ** 3; value += 1) {
    const red = 160 + Math.floor(value / (96 * 96));
    const green = 160 + (Math.floor(value / 96) % 96);
    const blue = 160 + (value % 96);
    const color = `#${[red, green, blue]
      .map((channel) => channel.toString(16).padStart(2, "0"))
      .join("")}`;
    if (!usedColors.has(color)) return color;
  }

  throw new Error("No unused subscription card colors remain.");
}

export function SubscriptionsProvider({
  children,
}: SubscriptionsProviderProps) {
  const [subscriptions, setSubscriptions] =
    useState<Subscription[]>(HOME_SUBSCRIPTIONS);

  const addSubscription = (subscription: Subscription) => {
    setSubscriptions((currentSubscriptions) => {
      const usedColors = new Set(
        currentSubscriptions
          .map((item) => item.color?.toLowerCase())
          .filter((color): color is string => Boolean(color)),
      );
      const color = getUniqueColor(subscription.color, usedColors);

      return [{ ...subscription, color }, ...currentSubscriptions];
    });
  };

  return (
    <SubscriptionsContext.Provider value={{ subscriptions, addSubscription }}>
      {children}
    </SubscriptionsContext.Provider>
  );
}

export function useSubscriptions() {
  const context = useContext(SubscriptionsContext);
  if (!context) {
    throw new Error(
      "useSubscriptions must be used within a SubscriptionsProvider.",
    );
  }

  return context;
}
