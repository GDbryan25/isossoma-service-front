import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/ApiResponse';
import { CategoryResponse } from '../models/ratecatalog/category/CategoryResponse';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  baseUrl: string = `${environment.apiBaseUrl}/api/v1/service-category`;

  private readonly http = inject(HttpClient);

  findAll(serviceId?: number): Observable<ApiResponse<CategoryResponse[]>> {
    let params = new HttpParams();

    if (serviceId !== undefined) {
      params = params.set('serviceId', serviceId);
    }

    return this.http.get<ApiResponse<CategoryResponse[]>>(this.baseUrl, { params });
  }
}
