export interface TableFromApi {
  id: string;
  seats: number;
  number: number;
  positionX: number;
  positionY: number;
  status?: string;
  reservationId?: string;
  reservation?: Reservation;
}

export interface Reservation {
  id: string;
  groupName: string;
  dateTime: string;
  status: string;
}

export const CARD_SIZE = 128;
