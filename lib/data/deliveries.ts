import type { Tone } from "@/components/ui/tone";

export const deliveriesPerDay = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  ticks: ["14", "9", "5", "0"],
  max: 14,
  completed: [8, 10, 9, 11, 12, 10, 4],
  scheduled: [9, 10, 11, 11, 13, 10, 9],
};

export type Driver = {
  initials: string;
  name: string;
  route: string;
  status: string;
  statusTone: Tone;
  /** Share of today's stops already completed, 0–100. */
  progress: number;
};

export const drivers: Driver[] = [
  {
    initials: "MD",
    name: "Musa Danjuma",
    route: "3 stops · Abeokuta route",
    status: "On road",
    statusTone: "info",
    progress: 75,
  },
  {
    initials: "IN",
    name: "Ifeanyi Nwosu",
    route: "2 stops · Sagamu route",
    status: "On road",
    statusTone: "info",
    progress: 50,
  },
  {
    initials: "BO",
    name: "Blessing Ojo",
    route: "4 stops · Lagos route",
    status: "Completed",
    statusTone: "success",
    progress: 100,
  },
];

export type Delivery = {
  reference: string;
  load: string;
  customer: string;
  destination: string;
  driver: string;
  date: string;
  window: string;
  status: string;
  statusTone: Tone;
  statusDot?: boolean;
};

export const deliveries: Delivery[] = [
  {
    reference: "#ORD-2840",
    load: "1 item · 40 kg",
    customer: "Sunrise Supermarket",
    destination: "Ikeja, Lagos",
    driver: "Blessing Ojo",
    date: "09 Aug",
    window: "14:00–16:00",
    status: "In transit",
    statusTone: "info",
  },
  {
    reference: "#ORD-2839",
    load: "5 items · 120 kg",
    customer: "Chop Life Restaurant",
    destination: "Bodija, Ibadan",
    driver: "Musa Danjuma",
    date: "09 Aug",
    window: "16:00–18:00",
    status: "Preparing",
    statusTone: "warning",
  },
  {
    reference: "#ORD-2838",
    load: "2 items · 210 kg",
    customer: "Kola Poultry Traders",
    destination: "Sagamu, Ogun",
    driver: "Ifeanyi Nwosu",
    date: "10 Aug",
    window: "08:00–10:00",
    status: "Scheduled",
    statusTone: "neutral",
    statusDot: false,
  },
  {
    reference: "#ORD-2841",
    load: "3 items · 96 kg",
    customer: "Mama Ngozi Foods",
    destination: "Kuto, Abeokuta",
    driver: "Musa Danjuma",
    date: "09 Aug",
    window: "12:30–14:05",
    status: "Delivered",
    statusTone: "success",
  },
  {
    reference: "#ORD-2834",
    load: "2 items · 64 kg",
    customer: "Blessed Mart",
    destination: "Ijebu-Ode, Ogun",
    driver: "Blessing Ojo",
    date: "08 Aug",
    window: "09:10–11:00",
    status: "Delivered",
    statusTone: "success",
  },
  {
    reference: "#ORD-2833",
    load: "1 item · 30 kg",
    customer: "Chop Life Restaurant",
    destination: "Bodija, Ibadan",
    driver: "Ifeanyi Nwosu",
    date: "07 Aug",
    window: "Failed 2 attempts",
    status: "Failed",
    statusTone: "error",
  },
];
