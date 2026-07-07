import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiResponse } from '../models/ApiResponse';
import { Observable } from 'rxjs';
import { ItemSupplierResponse } from '../models/raatecatalog/item-supplier/response/ItemSupplierResponse';
import { PageResponse } from '../models/PageResponse';
import { CreateItemSupplier } from '../models/raatecatalog/item-supplier/request/CreateItemSupplier';
import { UpdateItemSupplier } from '../models/raatecatalog/item-supplier/request/UpdateItemSupplier';
import { ItemSupplierDetailResponse } from '../models/raatecatalog/item-supplier/response/ItemSupplierDetailResponse';
import { ItemSupplierPageableFilter } from '../models/raatecatalog/item-supplier/filters/ItemSupplierPageableFilter';

@Injectable({
  providedIn: 'root'
})
export class ItemSupplierService {
  baseUrl: string = 'http://localhost:8080/api/v1/item-supplier';

  private readonly http = inject(HttpClient);

  create(request: CreateItemSupplier): Observable<ApiResponse<ItemSupplierResponse>> {
    return this.http.post<ApiResponse<ItemSupplierResponse>>(this.baseUrl, request);
  }

  update(id: number, request: UpdateItemSupplier): Observable<ApiResponse<ItemSupplierResponse>> {
    return this.http.put<ApiResponse<ItemSupplierResponse>>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`);
  }

  findById(id: number): Observable<ApiResponse<ItemSupplierDetailResponse>> {
    return this.http.get<ApiResponse<ItemSupplierDetailResponse>>(`${this.baseUrl}/${id}`);
  }

  search(filter?: ItemSupplierPageableFilter): Observable<ApiResponse<PageResponse<ItemSupplierResponse>>> {
    let params = new HttpParams();

    if (filter?.itemId) {
      params = params.set('itemId', filter.itemId);
    }

    if (filter?.status) {
      params = params.set('status', filter.status);
    }

    if (filter?.name?.trim()) {
      params = params.set('name', filter.name.trim());
    }

    if (filter?.page !== undefined) {
      params = params.set('page', filter.page);
    }

    if (filter?.size !== undefined) {
      params = params.set('size', filter.size);
    }

    return this.http.get<ApiResponse<PageResponse<ItemSupplierResponse>>>(this.baseUrl, { params });
  }
}
