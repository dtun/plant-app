import { DrawerStack } from "@/components/ui/drawer-stack";
import { useLingui } from "@lingui/react/macro";

export default function ShareLayout() {
  let { t } = useLingui();

  return <DrawerStack title={t`Share`} />;
}
