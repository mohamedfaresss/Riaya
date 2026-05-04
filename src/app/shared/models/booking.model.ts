export interface Booking {
  id: string;
  doctorName: string;
  patientName?: string;
  doctorImage?: string;
  specialization?: string;
  status: number;
  startAtUtc: string;
  endAtUtc: string;
  reason?: string;
}
export interface TimeSlot {
  id: string;
  startAtUtc: Date;
  endAtUtc: Date;
  isBooked: boolean;
}
