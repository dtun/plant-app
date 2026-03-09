import {
  ActivityIndicator as RNActivityIndicator,
  ActivityIndicatorProps as RNActivityIndicatorProps,
} from "react-native";
import { withUniwind } from "uniwind";

type ActivityIndicatorProps = RNActivityIndicatorProps & {
  colorClassName?: string;
};

let StyledActivityIndicator = withUniwind(RNActivityIndicator);

export function ActivityIndicator({
  colorClassName = "text-color",
  ...props
}: ActivityIndicatorProps) {
  return <StyledActivityIndicator colorClassName={colorClassName} {...props} />;
}
