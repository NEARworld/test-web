import { ReservationStatus } from "@prisma/client";

export interface MenuItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
}

export interface MenuData {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface Reservation {
  id: string;
  groupName: string;
  dateTime: string;
  seatNumber: string;
  menuItems: MenuItem[];
  status: ReservationStatus;
  createdBy: {
    name: string;
  };
}

export interface ReservationDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: Reservation | null;
  calculateTotalPrice: (menu: MenuItem[]) => number;
}

export interface ReservationFormData {
  groupName: string;
  time: string;
  seatNumber: string;
  menuItems: MenuItem[];
}
