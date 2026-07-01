import { getSession } from "@/lib/session";
import { HeaderClient } from "./header-client";

export function Header() {
  const user = getSession();
  return <HeaderClient user={user} />;
}
