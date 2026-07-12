import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/ApiResponse';
import { ServiceTypeResponse } from '../models/ratecatalog/service-type/ServiceTypeResponse';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServiceTypeService {
  baseUrl: string = `${environment.apiBaseUrl}/api/v1/service-type`;

  private readonly http = inject(HttpClient);

  findAll(): Observable<ApiResponse<ServiceTypeResponse[]>> {
    return this.http.get<ApiResponse<ServiceTypeResponse[]>>(this.baseUrl);
  }
}
