import type { Tone } from "@/components/ui/tone";

export type Employee = {
  initials: string;
  name: string;
  role: string;
  joined: string;
  phone: string;
  assigned: string;
  /** Workload line on the card; the table shows the count only. */
  workload: string;
  tasks: string;
  attendance: string;
  /** Tints the attendance figure when notably high or low. */
  attendanceTone?: Tone;
  status: string;
  statusTone: Tone;
  statusDot?: boolean;
};

export const employees: Employee[] = [
  {
    initials: "AO",
    name: "Amina Okoro",
    role: "Farm Supervisor",
    joined: "Joined Mar 2024",
    phone: "+234 802 331 7741",
    assigned: "House 01 · House 02",
    workload: "5 open tasks",
    tasks: "5",
    attendance: "98%",
    attendanceTone: "success",
    status: "On duty",
    statusTone: "success",
  },
  {
    initials: "TB",
    name: "Tunde Bello",
    role: "Poultry Attendant",
    joined: "Joined Aug 2024",
    phone: "+234 803 118 2290",
    assigned: "House 03",
    workload: "3 open tasks",
    tasks: "3",
    attendance: "94%",
    status: "On duty",
    statusTone: "success",
  },
  {
    initials: "CE",
    name: "Dr. Chike Eze",
    role: "Veterinarian",
    joined: "Contract vet",
    phone: "+234 807 550 6612",
    assigned: "All houses",
    workload: "2 open tasks",
    tasks: "2",
    attendance: "—",
    attendanceTone: "neutral",
    status: "Visiting",
    statusTone: "info",
  },
  {
    initials: "GA",
    name: "Grace Amadi",
    role: "Poultry Attendant",
    joined: "Joined Jan 2025",
    phone: "+234 805 227 8834",
    assigned: "House 04 · House 05",
    workload: "4 open tasks",
    tasks: "4",
    attendance: "96%",
    attendanceTone: "success",
    status: "On duty",
    statusTone: "success",
  },
  {
    initials: "MD",
    name: "Musa Danjuma",
    role: "Driver",
    joined: "Joined Jun 2023",
    phone: "+234 806 449 1130",
    assigned: "Logistics",
    workload: "3 deliveries",
    tasks: "3",
    attendance: "92%",
    status: "On road",
    statusTone: "info",
  },
  {
    initials: "BO",
    name: "Blessing Ojo",
    role: "Sales Officer",
    joined: "Joined Feb 2025",
    phone: "+234 809 662 0075",
    assigned: "Sales & CRM",
    workload: "0 open tasks",
    tasks: "0",
    attendance: "89%",
    attendanceTone: "warning",
    status: "On leave",
    statusTone: "neutral",
    statusDot: false,
  },
];
