import { CreateCustomer } from "../request/CreateCustomer";

export interface Customer extends CreateCustomer {
    id: number;
}