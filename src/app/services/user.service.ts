import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CreateUserRequest } from '../models/auth/users/request/CreateUserRequest';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/ApiResponse';
import { UserResponse } from '../models/auth/users/response/UserResponse';
import { UserDetailResponse } from '../models/auth/users/response/UserDetailResponse';
import { UserPageableFilters } from '../models/auth/users/filters/UserPageableFilters';
import { PageResponse } from '../models/PageResponse';
import { PageableResponse } from '../models/PageableResponse';
import { UpdateUserRequest } from '../models/auth/users/request/UpdateUserRequest';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  baseUrl: string = `${environment.apiBaseUrl}/api/v1/user`;

  private readonly http = inject(HttpClient);

  create(request: CreateUserRequest): Observable<ApiResponse<UserResponse>> {
    return this.http.post<ApiResponse<UserResponse>>(this.baseUrl, request);
  }

  reactivate(id: number): Observable<ApiResponse<UserResponse>> {
    return this.http.patch<ApiResponse<UserResponse>>(`${this.baseUrl}/${id}/reactivate`, {});
  }

  findById(id: number): Observable<ApiResponse<UserDetailResponse>> {
    return this.http.get<ApiResponse<UserDetailResponse>>(`${this.baseUrl}/${id}`);
  }

  findAll(filter?: UserPageableFilters): Observable<ApiResponse<PageResponse<UserResponse>>> {
    let params = new HttpParams();

    if (filter?.status) {
      params = params.set('status', filter.status);
    }

    if (filter?.firstname?.trim()) {
      params = params.set('firstname', filter.firstname.trim());
    }

    if (filter?.lastname?.trim()) {
      params = params.set('lastname', filter.lastname.trim());
    }

    if (filter?.page !== undefined) {
      params = params.set('page', filter.page);
    }

    if (filter?.size !== undefined) {
      params = params.set('size', filter.size);
    }

    return this.http.get<ApiResponse<PageResponse<UserResponse>>>(this.baseUrl, { params });
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  update(id: number, request: UpdateUserRequest): Observable<ApiResponse<UserResponse>> {
    return this.http.put<ApiResponse<UserResponse>>(`${this.baseUrl}/${id}`, request);
  }
}
