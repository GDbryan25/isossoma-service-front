import { SortResponse } from "./SortResponse";

export interface PageableResponse {
    pageNumber: number,
    pageSize: number,
    sort: SortResponse,
    offset: number,
    paged: boolean,
    unpaged: boolean
}