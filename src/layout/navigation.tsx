import { GroupIcon, LockIcon, TaskIcon } from "@/icons/index";
import { PERMISSIONS, type NavItem } from "@/lib/authz";

/**
 * The dashboard navigation tree.
 *
 * Each entry declares the permission it needs through `rule`; the sidebar never
 * checks permissions inline. Entries without a rule stay visible to every
 * signed-in account.
 *
 * Keep a `rule` here in step with the matching entry in `ROUTE_PERMISSIONS`:
 * this decides what is *shown*, that decides what can be *opened*.
 */
export const mainNavItems: NavItem[] = [
  {
    icon: <GroupIcon />,
    name: "Users",
    path: "/users",
    rule: { permission: PERMISSIONS.USERS.READ },
  },
  {
    icon: <TaskIcon />,
    name: "Settings",
    subItems: [
      {
        name: "Settings",
        path: "/settings",
        rule: { permission: PERMISSIONS.SETTINGS.READ },
      },
      {
        name: "Categories",
        path: "/settings/categories",
        rule: { permission: PERMISSIONS.SETTING_CATEGORIES.READ },
      },
    ],
  },
  {
    icon: <LockIcon />,
    name: "Access Control",
    subItems: [
      {
        name: "Roles",
        path: "/roles",
        rule: { permission: PERMISSIONS.ROLES.READ },
      },
      {
        name: "Permissions",
        path: "/permissions",
        rule: { permission: PERMISSIONS.PERMISSIONS.READ },
      },
    ],
  },
  /* Demo menu items are intentionally hidden. Their routes and page files remain available.
  {
    icon: <GridIcon />,
    name: "Dashboard",
    subItems: [{ name: "Ecommerce", path: "/", pro: false }],
  },
  {
    icon: <CalenderIcon />,
    name: "Calendar",
    path: "/calendar",
  },
  {
    icon: <UserCircleIcon />,
    name: "User Profile",
    path: "/profile",
  },

  {
    name: "Forms",
    icon: <ListIcon />,
    subItems: [{ name: "Form Elements", path: "/form-elements", pro: false }],
  },
  {
    name: "Tables",
    icon: <TableIcon />,
    subItems: [{ name: "Basic Tables", path: "/basic-tables", pro: false }],
  },
  {
    name: "Pages",
    icon: <PageIcon />,
    subItems: [
      { name: "Blank Page", path: "/blank", pro: false },
      { name: "404 Error", path: "/error-404", pro: false },
    ],
  },
  */
];

export const otherNavItems: NavItem[] = [
  /* Demo menu items are intentionally hidden. Their routes and page files remain available.
  {
    icon: <PieChartIcon />,
    name: "Charts",
    subItems: [
      { name: "Line Chart", path: "/line-chart", pro: false },
      { name: "Bar Chart", path: "/bar-chart", pro: false },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "UI Elements",
    subItems: [
      { name: "Alerts", path: "/alerts", pro: false },
      { name: "Avatar", path: "/avatars", pro: false },
      { name: "Badge", path: "/badge", pro: false },
      { name: "Buttons", path: "/buttons", pro: false },
      { name: "Images", path: "/images", pro: false },
      { name: "Videos", path: "/videos", pro: false },
    ],
  },
  {
    icon: <PlugInIcon />,
    name: "Authentication",
    subItems: [
      { name: "Sign In", path: "/signin", pro: false },
      { name: "Sign Up", path: "/signup", pro: false },
    ],
  },
  */
];
