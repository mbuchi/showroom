export type ParcelState = 'New' | 'Due Diligence' | 'Closed' | 'Contacted';
export type ParcelPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Parcel {
  id: string;
  user_id: string;
  address: string | null;
  municipality: string | null;
  state: ParcelState;
  priority: ParcelPriority;
  tags: string[];
  created_at: string;
  updated_at: string;
}
