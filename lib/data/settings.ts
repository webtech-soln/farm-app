import "server-only";

import { cache } from "react";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { farmSettings, type FarmSettings } from "@/lib/db/schema";

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
  name: string;
  icon?:
    | "globe"
    | "clock-3"
    | "banknote"
    | "scale"
    | "thermometer"
    | "droplets"
    | "calendar";
  unit?: string;
};

const DEFAULTS: Omit<FarmSettings, "id" | "updatedAt"> = {
  farmName: "Jayda Farms",
  registeredName: null,
  estateName: null,
  address: null,
  cityState: null,
  country: null,
  timezone: null,
  currency: "USD ($)",
  weightUnit: "Kilograms (kg)",
  temperatureUnit: "Celsius (°C)",
  volumeUnit: "Litres (L)",
  dateFormat: "DD MMM YYYY",
  dailyMortalityAlertPct: 0.4,
  weeklyMortalityAlertPct: 2,
  minProductionRatePct: 82,
  feedMinimumStockKg: 1000,
  medicineExpiryWarningDays: 30,
  temperatureMinC: 24,
  temperatureMaxC: 30,
  escalateCriticalAlerts: true,
  blockAnomalousRecords: true,
  autoPurchaseSuggestions: false,
};

/**
 * Settings drive validation thresholds all over the app, so this is memoised
 * per request and falls back to sane defaults if the row is missing.
 */
export const getFarmSettings = cache(async (): Promise<FarmSettings> => {
  const [row] = await db
    .select()
    .from(farmSettings)
    .where(eq(farmSettings.id, 1))
    .limit(1);

  return row ?? { id: 1, updatedAt: new Date(), ...DEFAULTS };
});

export async function getFarmProfileFields(): Promise<SettingsField[][]> {
  const settings = await getFarmSettings();
  return [
    [
      { label: "Farm name", name: "farmName", value: settings.farmName },
      {
        label: "Registered business name",
        name: "registeredName",
        value: settings.registeredName ?? "",
      },
    ],
    [
      { label: "Farm address", name: "address", value: settings.address ?? "" },
      { label: "City / State", name: "cityState", value: settings.cityState ?? "" },
    ],
    [
      { label: "Country", name: "country", value: settings.country ?? "", icon: "globe" },
      { label: "Timezone", name: "timezone", value: settings.timezone ?? "", icon: "clock-3" },
      { label: "Currency", name: "currency", value: settings.currency ?? "", icon: "banknote" },
    ],
  ];
}

export async function getUnitFields(): Promise<SettingsField[]> {
  const settings = await getFarmSettings();
  return [
    { label: "Weight", name: "weightUnit", value: settings.weightUnit ?? "", icon: "scale" },
    { label: "Temperature", name: "temperatureUnit", value: settings.temperatureUnit ?? "", icon: "thermometer" },
    { label: "Volume", name: "volumeUnit", value: settings.volumeUnit ?? "", icon: "droplets" },
    { label: "Date format", name: "dateFormat", value: settings.dateFormat ?? "", icon: "calendar" },
  ];
}

export async function getThresholdFields(): Promise<SettingsField[][]> {
  const settings = await getFarmSettings();
  return [
    [
      { label: "Daily mortality alert", name: "dailyMortalityAlertPct", value: String(settings.dailyMortalityAlertPct), unit: "%" },
      { label: "Weekly mortality alert", name: "weeklyMortalityAlertPct", value: String(settings.weeklyMortalityAlertPct), unit: "%" },
      { label: "Minimum production rate", name: "minProductionRatePct", value: String(settings.minProductionRatePct), unit: "%" },
    ],
    [
      { label: "Feed minimum stock", name: "feedMinimumStockKg", value: String(settings.feedMinimumStockKg), unit: "kg" },
      { label: "Medicine expiry warning", name: "medicineExpiryWarningDays", value: String(settings.medicineExpiryWarningDays), unit: "days" },
      { label: "Temperature minimum", name: "temperatureMinC", value: String(settings.temperatureMinC), unit: "°C" },
      { label: "Temperature maximum", name: "temperatureMaxC", value: String(settings.temperatureMaxC), unit: "°C" },
    ],
  ];
}

export async function getThresholdToggles() {
  const settings = await getFarmSettings();
  return [
    {
      name: "escalateCriticalAlerts",
      title: "Escalate critical alerts to the farm owner",
      description: "Sends SMS in addition to in-app notification",
      enabled: settings.escalateCriticalAlerts,
    },
    {
      name: "blockAnomalousRecords",
      title: "Block daily record submission when values look wrong",
      description:
        "Warns when entries deviate more than 30% from the 7-day average",
      enabled: settings.blockAnomalousRecords,
    },
    {
      name: "autoPurchaseSuggestions",
      title: "Auto-generate purchase suggestion on low stock",
      description: "Creates a draft purchase order for the preferred supplier",
      enabled: settings.autoPurchaseSuggestions,
    },
  ];
}
