import { SortResponse } from "./SortResponse";

export interface PageResponse<T> {
    content: T[],
    pageable: any,
    last: boolean,
    totalPages: number,
    totalElements: number,
    size: number,
    number: number,
    sort: SortResponse,
    first: boolean,
    numberOfElements: number,
    empty: boolean
}