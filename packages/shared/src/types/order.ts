export type ProductType = 'natal_chart' | 'transit_report';

export type OrderStatus = 'pending' | 'paid' | 'refunded' | 'expired';

export interface Product {
  id: string;
  type: ProductType;
  name: string;
  priceBrl: number;
  active: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  productType: ProductType;
  status: OrderStatus;
  amount: number;
  mpPaymentId: string | null;
  mpPreferenceId: string | null;
  createdAt: string;
  paidAt: string | null;
}
