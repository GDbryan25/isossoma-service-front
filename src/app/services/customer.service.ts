import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { SaveCustomer } from '../models/customers/request/SaveCustomer';
import { ApiResponse } from '../models/ApiResponse';
import { Customer } from '../models/customers/response/Customer';
import { Observable } from 'rxjs';
import { CustomerFilter } from '../models/customers/filters/CustomerFilter';
import { PageResponse } from '../models/PageResponse';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  baseUrl: string = 'http://localhost:8080/api/v1/customer';

  private readonly http = inject(HttpClient);

  create(body: SaveCustomer): Observable<ApiResponse<Customer>> {
    return this.http.post<ApiResponse<Customer>>(this.baseUrl, body);
  }

  update(id: number, body: SaveCustomer): Observable<ApiResponse<Customer>> {
    return this.http.put<ApiResponse<Customer>>(`${this.baseUrl}/${id}`, body);
  }

  reactivate(id: number): Observable<ApiResponse<Customer>> {
    return this.http.patch<ApiResponse<Customer>>(`${this.baseUrl}/${id}/reactivate`, {});
  }

  delete(id: number): Observable<ApiResponse<number>> {
    return this.http.delete<ApiResponse<number>>(`${this.baseUrl}/${id}`);
  }

  listAll(filter: CustomerFilter): Observable<ApiResponse<PageResponse<Customer>>> {
    let params = new HttpParams();

    if (filter.name) {
      params = params.set('name', filter.name);
    }

    if (filter.status) {
      params = params.set('status', filter.status);
    }

    params = params
      .set('page', filter.page ?? 0)
      .set('size', filter.size ?? 10);

    return this.http.get<ApiResponse<PageResponse<Customer>>>(this.baseUrl, { params });
  }

  findById(id: number): Observable<ApiResponse<Customer>> {
    return this.http.get<ApiResponse<Customer>>(`${this.baseUrl}/${id}`);
  }
}
