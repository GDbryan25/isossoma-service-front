import { CreateServiceItemSupplier } from "../../item-supplier/request/CreateServiceItemSupplier";

export interface CreateServiceItem {
  description: string;
  parameterType: string;
  note?: string;
  serviceCategoryId: number;
  suppliers: CreateServiceItemSupplier[];
}