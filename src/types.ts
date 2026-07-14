export type ItemCategory = 'MATERIAL' | 'EQUIPMENT';

export interface InventoryItem {
  id: string;
  barcode: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  minQuantity: number;
  expiryMonth?: string; // Format: YYYY-MM
  checkInterval?: number; // 1, 3, 6
  imageUrl?: string;
  iconName?: string;
  lastUpdated: string;
}

export type ViewState = 'DASHBOARD' | 'LIST' | 'SCANNER' | 'FORM' | 'PRINT_BARCODE' | 'USER_MANAGEMENT';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'user';
  createdAt?: string;
}

export interface AppState {
  items: InventoryItem[];
  theme: 'light' | 'dark';
}
