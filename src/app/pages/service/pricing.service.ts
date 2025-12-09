import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PricingService {
  constructor(private http: HttpClient) {}

  getDemoData() {
    return [
      {
        serviceTypeId: '1',
        serviceTypeDescription: 'Monitoreo Ambiental',
        categoryTypeId: 'CAT001',
        categoryTypeDescription: 'ECA AIRE'
      },
      {
        serviceTypeId: '2',
        serviceTypeDescription: 'Monitoreo Ocupacional',
        categoryTypeId: 'CAT002',
        categoryTypeDescription: 'ECA EXAMEN'
      },
      {
        serviceTypeId: '3',
        serviceTypeDescription: 'Monitoreo Biologico',
        categoryTypeId: 'CAT003',
        categoryTypeDescription: 'ECA PRUEBA'
      }
    ];
  }
}