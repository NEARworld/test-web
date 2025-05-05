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
