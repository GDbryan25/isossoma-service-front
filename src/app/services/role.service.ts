import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/ApiResponse';
import { CreateRoleRequest } from '../models/auth/roles/request/CreateRoleRequest';
import { RoleSimpleResponse } from '../models/auth/roles/response/RoleSimpleResponse';
import { UpdateRoleRequest } from '../models/auth/roles/request/UpdateRoleRequest';
import { RoleDetailResponse } from '../models/auth/roles/response/RoleDetailResponse';
import { PageResponse } from '../models/PageResponse';
import { RoleFilters } from '../models/auth/roles/filters/RoleFilters';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  baseUrl: string = 'http://localhost:8080/api/v1/role';

  private readonly http = inject(HttpClient);

  create(request: CreateRoleRequest): Observable<ApiResponse<RoleSimpleResponse>> {
    return this.http.post<ApiResponse<RoleSimpleResponse>>(this.baseUrl, request);
  }

  update(id: number, request: UpdateRoleRequest): Observable<ApiResponse<RoleSimpleResponse>> {
    return this.http.put<ApiResponse<RoleSimpleResponse>>(`${this.baseUrl}/${id}`, request);
  }

  findById(id: number): Observable<ApiResponse<RoleDetailResponse>> {
    return this.http.get<ApiResponse<RoleDetailResponse>>(`${this.baseUrl}/${id}`);
  }

  findAll(filter: RoleFilters): Observable<ApiResponse<PageResponse<RoleSimpleResponse>>> {
    const { status, name, page, size } = filter;
    let params = new HttpParams();

    if (status) {
      params = params.set('status', status);
    }

    if (name?.trim()) {
      params = params.set('name', name.trim());
    }

    if (page !== undefined) {
      params = params.set('page', page);
    }

    if (size !== undefined) {
      params = params.set('size', size);
    }

    return this.http.get<ApiResponse<PageResponse<RoleSimpleResponse>>>(this.baseUrl, { params });
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
