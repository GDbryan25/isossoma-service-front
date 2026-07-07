import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/ApiResponse';
import { PermissionResponse } from '../models/auth/permissions/PermissionResponse';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  baseUrl: string = 'http://localhost:8080/api/v1/permission';

  private readonly http = inject(HttpClient);

  findAll(name?: string): Observable<ApiResponse<PermissionResponse[]>> {
    let params = new HttpParams();

    if (name?.trim()) {
      params = params.set('name', name.trim());
    }

    return this.http.get<ApiResponse<PermissionResponse[]>>(this.baseUrl,{ params });
  }
}
