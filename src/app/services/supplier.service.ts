import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CreateSupplierRequest } from '../models/raatecatalog/supplier/request/CreateSupplierRequest';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/ApiResponse';
import { SupplierResponse } from '../models/raatecatalog/supplier/response/SupplierResponse';
import { UpdateSupplierRequest } from '../models/raatecatalog/supplier/request/UpdateSupplierRequest';
import { PageResponse } from '../models/PageResponse';
import { SupplierFilter } from '../models/raatecatalog/supplier/filters/SupplierFilter';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  baseUrl: string = 'http://localhost:8080/api/v1/supplier';

  private readonly http = inject(HttpClient);

  create(request: CreateSupplierRequest): Observable<ApiResponse<SupplierResponse>> {
    return this.http.post<ApiResponse<SupplierResponse>>(this.baseUrl, request);
  }

  update(id: number, request: UpdateSupplierRequest): Observable<ApiResponse<SupplierResponse>> {
    return this.http.put<ApiResponse<SupplierResponse>>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`);
  }

  findById(id: number): Observable<ApiResponse<SupplierResponse>> {
    return this.http.get<ApiResponse<SupplierResponse>>(`${this.baseUrl}/${id}`);
  }

  findAll(filter?: SupplierFilter): Observable<ApiResponse<PageResponse<SupplierResponse>>> {
    let params = new HttpParams();

    if (filter?.name?.trim()) {
      params = params.set('name', filter.name.trim());
    }

    if (filter?.status) {
      params = params.set('status', filter.status);
    }

    if (filter?.page !== undefined) {
      params = params.set('page', filter.page);
    }

    if (filter?.size !== undefined) {
      params = params.set('size', filter.size);
    }

    return this.http.get<ApiResponse<PageResponse<SupplierResponse>>>(this.baseUrl, { params });
  }
}
