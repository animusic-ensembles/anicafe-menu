export type StockLevel = "high" | "low" | "none";

export interface MenuItem {
  itemName: string;
  priceCents: number;
  stock: StockLevel;
  flags: string[];
}

export interface MenuCategory {
  categoryName: string;
  position?: number;
  items: MenuItem[];
}
