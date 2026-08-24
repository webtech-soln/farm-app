import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Bird,
  Box,
  ChartPie,
  CircleCheckBig,
  ClipboardList,
  Egg,
  FileText,
  HeartCrack,
  House,
  LayoutDashboard,
  MapPin,
  Menu,
  Package,
  Pill,
  ReceiptText,
  Scale,
  Settings,
  ShoppingCart,
  Stethoscope,
  Syringe,
  TrendingDown,
  TrendingUp,
  Truck,
  UserRound,
  Users,
  Warehouse,
  Wheat,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Pill counter rendered at the end of the row (Notifications only). */
  badge?: number;
};

/**
 * The sidebar groups exactly as they appear on the Pencil board
 * `00 · Component / Sidebar`. This is the single source of truth for the
 * desktop sidebar, the tablet icon rail and URL-derived active state.
 */
export const navGroups: NavItem[][] = [
  [{ label: "Dashboard", href: "/", icon: LayoutDashboard }],
  [
    { label: "Houses", href: "/houses", icon: Warehouse },
    { label: "Flocks", href: "/flocks", icon: Bird },
  ],
  [
    { label: "Daily Records", href: "/records/daily", icon: ClipboardList },
    { label: "Mortality", href: "/records/mortality", icon: HeartCrack },
    { label: "Weight", href: "/records/weight", icon: Scale },
    { label: "Feed", href: "/feed", icon: Wheat },
    { label: "Egg Production", href: "/eggs", icon: Egg },
  ],
  [
    { label: "Health Records", href: "/health", icon: Stethoscope },
    { label: "Vaccinations", href: "/vaccinations", icon: Syringe },
    { label: "Medicines", href: "/medicines", icon: Pill },
  ],
  [
    { label: "Inventory", href: "/inventory", icon: Package },
    { label: "Suppliers", href: "/suppliers", icon: Truck },
  ],
  [
    { label: "Sales Overview", href: "/sales", icon: ShoppingCart },
    { label: "Products", href: "/products", icon: Box },
    { label: "Customers", href: "/customers", icon: Users },
    { label: "Orders", href: "/orders", icon: ReceiptText },
    { label: "Deliveries", href: "/deliveries", icon: MapPin },
  ],
  [
    { label: "Revenue", href: "/revenue", icon: TrendingUp },
    { label: "Expenses", href: "/expenses", icon: TrendingDown },
    { label: "Profitability", href: "/finance", icon: ChartPie },
  ],
  [
    { label: "Employees", href: "/employees", icon: UserRound },
    { label: "Tasks", href: "/tasks", icon: CircleCheckBig },
  ],
  [
    { label: "Reports", href: "/reports", icon: FileText },
    { label: "Notifications", href: "/notifications", icon: Bell, badge: 6 },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
];

export const navItems: NavItem[] = navGroups.flat();

/** Phone bottom bar from board `29 · Mobile`. The centre slot is the FAB. */
export const bottomNavItems: NavItem[] = [
  { label: "Home", href: "/", icon: House },
  { label: "Flocks", href: "/flocks", icon: Bird },
  { label: "Tasks", href: "/tasks", icon: CircleCheckBig },
  { label: "More", href: "/settings", icon: Menu },
];

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
