import { ItemSupplierResponse } from "../../item-supplier/response/ItemSupplierResponse";

export interface ItemWithSupplierResponse {
  categoryId: number;
  description: string;
  parameterType: string;
  note?: string;
  suppliers: ItemSupplierResponse[];
}