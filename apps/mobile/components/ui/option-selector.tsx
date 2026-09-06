import { useLingui } from "@lingui/react/macro";
import { Text, TouchableOpacity, View } from "react-native";

interface OptionSelectorProps<T extends string> {
  label?: string;
  onChange: (value: T) => void;
  /** Derives the testID for each option's button from the option value. */
  optionTestID?: (option: T) => string;
  options: readonly T[];
  value?: T;
}

export function OptionSelector<T extends string>({
  label,
  onChange,
  optionTestID,
  options,
  value,
}: OptionSelectorProps<T>) {
  let { t } = useLingui();
  return (
    <View className="flex-row gap-3">
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          className={
            value === option
              ? "flex-1 border rounded-xl p-3 items-center bg-tint border-tint"
              : "flex-1 border border-icon rounded-xl p-3 items-center"
          }
          onPress={() => onChange(option)}
          testID={optionTestID?.(option)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t`Select ${option}`}
          accessibilityState={{ selected: value === option }}
        >
          <Text
            className={
              value === option ? "text-base font-semibold text-white" : "text-base text-color"
            }
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
