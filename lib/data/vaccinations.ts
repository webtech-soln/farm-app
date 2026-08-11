import type { CalendarDay, CalendarEvent } from "@/components/ui/calendar-month";
import type { Tone } from "@/components/ui/tone";

/** August 2026 opens on a Saturday, so the grid starts on 27 July. */
const augustEvents: Record<number, CalendarEvent[]> = {
  4: [{ label: "Newcastle · JF-001", tone: "violet" }],
  6: [{ label: "Gumboro · JF-006", tone: "violet" }],
  10: [{ label: "Gumboro · JF-002", tone: "warning" }],
  12: [{ label: "Fowl pox · JF-003", tone: "violet" }],
  14: [{ label: "Deworming · all", tone: "violet" }],
  18: [{ label: "Newcastle · JF-005", tone: "violet" }],
  21: [{ label: "Bronchitis · JF-004", tone: "violet" }],
  25: [{ label: "Newcastle booster", tone: "violet" }],
  27: [{ label: "Fowl typhoid · JF-007", tone: "error" }],
};

export const vaccinationCalendar: CalendarDay[] = [
  ...[27, 28, 29, 30, 31].map((day) => ({ day, muted: true })),
  ...Array.from({ length: 31 }, (_, index) => {
    const day = index + 1;
    return { day, today: day === 9, events: augustEvents[day] };
  }),
  ...[1, 2, 3, 4, 5, 6].map((day) => ({ day, muted: true })),
];

export type Vaccination = {
  vaccine: string;
  route: string;
  flock: string;
  house: string;
  scheduled: string;
  scheduleNote: string;
  administeredBy: string;
  doses: string;
  status: string;
  statusTone: Tone;
};

export const vaccinations: Vaccination[] = [
  {
    vaccine: "Gumboro (booster)",
    route: "Drinking water",
    flock: "JF-2026-002",
    house: "House 02",
    scheduled: "10 Aug 2026",
    scheduleNote: "08:00",
    administeredBy: "Dr. Chike Eze",
    doses: "4,950",
    status: "Due tomorrow",
    statusTone: "warning",
  },
  {
    vaccine: "Fowl typhoid",
    route: "Subcutaneous",
    flock: "JF-2026-007",
    house: "House 03",
    scheduled: "05 Aug 2026",
    scheduleNote: "Overdue 4 days",
    administeredBy: "Unassigned",
    doses: "2,040",
    status: "Overdue",
    statusTone: "error",
  },
  {
    vaccine: "Fowl pox",
    route: "Wing web",
    flock: "JF-2026-003",
    house: "House 03",
    scheduled: "12 Aug 2026",
    scheduleNote: "09:00",
    administeredBy: "Dr. Chike Eze",
    doses: "4,600",
    status: "Scheduled",
    statusTone: "info",
  },
  {
    vaccine: "Newcastle (Lasota)",
    route: "Eye drop",
    flock: "JF-2026-001",
    house: "House 01",
    scheduled: "04 Aug 2026",
    scheduleNote: "Completed 08:20",
    administeredBy: "Dr. Chike Eze",
    doses: "4,830",
    status: "Completed",
    statusTone: "success",
  },
  {
    vaccine: "Gumboro (primary)",
    route: "Drinking water",
    flock: "JF-2026-006",
    house: "House 06",
    scheduled: "06 Aug 2026",
    scheduleNote: "Completed 07:50",
    administeredBy: "Grace Amadi",
    doses: "3,010",
    status: "Completed",
    statusTone: "success",
  },
  {
    vaccine: "Deworming",
    route: "Oral",
    flock: "All flocks",
    house: "All",
    scheduled: "14 Aug 2026",
    scheduleNote: "07:00",
    administeredBy: "Amina Okoro",
    doses: "24,850",
    status: "Scheduled",
    statusTone: "info",
  },
];
