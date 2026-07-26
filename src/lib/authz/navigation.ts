import {
  isRuleSatisfied,
  type GrantedPermissions,
  type PermissionRule,
} from "@/lib/authz/policy";
import type { ReactNode } from "react";

export type NavSubItem = {
  name: string;
  path: string;
  pro?: boolean;
  new?: boolean;
  /** Omitted for items every signed-in account may see. */
  rule?: PermissionRule;
};

export type NavItem = {
  name: string;
  icon: ReactNode;
  path?: string;
  /** Guards the whole group, including its children. */
  rule?: PermissionRule;
  subItems?: NavSubItem[];
};

/**
 * Filters the navigation tree down to what the account may actually reach.
 *
 * A group is dropped when its own rule fails, and also when every one of its
 * children was filtered out, so the sidebar never shows an empty accordion.
 * Items without a rule are kept, which is what makes the demo entries and any
 * future public link work with no extra configuration.
 */
export function filterNavItems(
  items: readonly NavItem[],
  granted: GrantedPermissions,
): NavItem[] {
  return items.flatMap((item) => {
    if (!isRuleSatisfied(granted, item.rule)) return [];
    if (item.subItems === undefined) return [item];

    const subItems = item.subItems.filter((subItem) =>
      isRuleSatisfied(granted, subItem.rule),
    );

    return subItems.length > 0 ? [{ ...item, subItems }] : [];
  });
}
