export type SettingsNavIcon =
  | "building-2"
  | "users"
  | "shield"
  | "bell"
  | "ruler"
  | "gauge"
  | "heart-pulse"
  | "package"
  | "plug"
  | "credit-card";

export const settingsNav: { label: string; icon: SettingsNavIcon }[] = [
  { label: "Farm profile", icon: "building-2" },
  { label: "Users", icon: "users" },
  { label: "Roles & permissions", icon: "shield" },
  { label: "Notifications", icon: "bell" },
  { label: "Units & formats", icon: "ruler" },
  { label: "Production thresholds", icon: "gauge" },
  { label: "Mortality thresholds", icon: "heart-pulse" },
  { label: "Inventory thresholds", icon: "package" },
  { label: "Integrations", icon: "plug" },
  { label: "Account & billing", icon: "credit-card" },
];

export type SettingsField = {
  label: string;
  value: string;
  /** Icon key resolved on the page; omitted fields render without one. */
  icon?: "globe" | "clock-3" | "banknote" | "scale" | "thermometer" | "droplets" | "calendar";
  unit?: string;
};

export const farmProfileFields: SettingsField[][] = [
  [
    { label: "Farm name", value: "Jayda Farms" },
    { label: "Registered business name", value: "Jayda Agro Ventures Ltd" },
  ],
  [
    { label: "Farm address", value: "Km 12 Abeokuta–Sagamu Road" },
    { label: "City / State", value: "Abeokuta, Ogun State" },
  ],
  [
    { label: "Country", value: "Nigeria", icon: "globe" },
    { label: "Timezone", value: "(GMT+1) West Africa", icon: "clock-3" },
    { label: "Currency", value: "USD ($)", icon: "banknote" },
  ],
];

export const unitFields: SettingsField[] = [
  { label: "Weight", value: "Kilograms (kg)", icon: "scale" },
  { label: "Temperature", value: "Celsius (°C)", icon: "thermometer" },
  { label: "Volume", value: "Litres (L)", icon: "droplets" },
  { label: "Date format", value: "DD MMM YYYY", icon: "calendar" },
];

export const thresholdFields: SettingsField[][] = [
  [
    { label: "Daily mortality alert", value: "0.4", unit: "%" },
    { label: "Weekly mortality alert", value: "2.0", unit: "%" },
    { label: "Minimum production rate", value: "82", unit: "%" },
  ],
  [
    { label: "Feed minimum stock", value: "1,000", unit: "kg" },
    { label: "Medicine expiry warning", value: "30", unit: "days" },
    { label: "Temperature band", value: "24 – 30", unit: "°C" },
  ],
];

export const thresholdToggles = [
  {
    title: "Escalate critical alerts to the farm owner",
    description: "Sends SMS in addition to in-app notification",
    enabled: true,
  },
  {
    title: "Block daily record submission when values look wrong",
    description:
      "Warns when entries deviate more than 30% from the 7-day average",
    enabled: true,
  },
  {
    title: "Auto-generate purchase suggestion on low stock",
    description: "Creates a draft purchase order for the preferred supplier",
    enabled: false,
  },
];
