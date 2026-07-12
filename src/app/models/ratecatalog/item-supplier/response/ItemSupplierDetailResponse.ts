export interface ItemSupplierDetailResponse {
  id: number;
  price: number;
  methodology?: string;
  accreditation?: string;
  location?: string;
  status: string;
  itemId: number;
  supplierId: number;
  supplierDescription: string;
}