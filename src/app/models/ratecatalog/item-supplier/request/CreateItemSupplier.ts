export interface CreateItemSupplier {
  itemId: number;
  supplierId: number;
  price: number;
  methodology?: string;
  accreditation?: string;
  location?: string;
}