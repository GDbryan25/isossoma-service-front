import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/ApiResponse';
import { PageResponse } from '../models/PageResponse';
import { CreateServiceItem } from '../models/ratecatalog/item/request/CreateServiceItem';
import { ItemResponse } from '../models/ratecatalog/item/response/ItemResponse';
import { UpdateServiceItem } from '../models/ratecatalog/item/request/UpdateServiceItem';
import { ItemWithSupplierResponse } from '../models/ratecatalog/item/response/ItemWithSupplierResponse';
import { ServiceItemFilter } from '../models/ratecatalog/item/filters/ServiceItemFilter';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  baseUrl: string = `${environment.apiBaseUrl}/api/v1/service-item`;

  private readonly http = inject(HttpClient);

  create(request: CreateServiceItem): Observable<ApiResponse<ItemResponse>> {
    return this.http.post<ApiResponse<ItemResponse>>(this.baseUrl, request);
  }

  update(id: number, request: UpdateServiceItem): Observable<ApiResponse<ItemResponse>> {
    return this.http.put<ApiResponse<ItemResponse>>(`${this.baseUrl}/${id}`, request);
  }

  reactivate(id: number): Observable<ApiResponse<ItemResponse>> {
    return this.http.patch<ApiResponse<ItemResponse>>(`${this.baseUrl}/${id}/reactivate`, {});
  }

  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`);
  }

  findById(id: number): Observable<ApiResponse<ItemWithSupplierResponse>> {
    return this.http.get<ApiResponse<ItemWithSupplierResponse>>(`${this.baseUrl}/${id}`);
  }

  search(filter?: ServiceItemFilter, page?: number, size?: number)
    : Observable<ApiResponse<PageResponse<ItemResponse>>> {
    let params = new HttpParams();

    if (filter?.description?.trim()) {
      params = params.set('description', filter.description.trim());
    }

    if (filter?.parameterType) {
      params = params.set('parameterType', filter.parameterType);
    }

    if (filter?.status) {
      params = params.set('status', filter.status);
    }

    if (filter?.categoryId) {
      params = params.set('categoryId', filter.categoryId);
    }

    if (filter?.supplierId) {
      params = params.set('supplierId', filter.supplierId);
    }

    if (page !== undefined) {
      params = params.set('page', page);
    }

    if (size !== undefined) {
      params = params.set('size', size);
    }

    return this.http.get<ApiResponse<PageResponse<ItemResponse>>>(this.baseUrl, { params });
  }
}
