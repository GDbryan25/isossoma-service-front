import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { RatingModule } from 'primeng/rating';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';

import { SaveCustomer } from '../../models/customers/request/SaveCustomer';
import { Customer } from '../../models/customers/response/Customer';
import { ApiResponse } from '../../models/ApiResponse';
import { CustomerService } from '../../services/customer.service';
import { CustomerFilter } from '../../models/customers/filters/CustomerFilter';
import { PageResponse } from '../../models/PageResponse';
import { AuthorizationService } from '../../services/authorization.service';
import { CanDirective } from '../../shared/directives/can.directive';

interface Column {
  field: string;
  header: string;
  customExportHeader?: string;
}

interface ExportColumn {
  title: string;
  dataKey: string;
}

@Component({
  selector: 'app-customers',
  imports: [
    CommonModule,
    TableModule,
    FormsModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    ToolbarModule,
    RatingModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    RadioButtonModule,
    InputNumberModule,
    DialogModule,
    TagModule,
    InputIconModule,
    IconFieldModule,
    ConfirmDialogModule,
    TooltipModule,
    CanDirective
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.scss'
})
export class CustomersComponent implements OnInit {
  productDialog: boolean = false;

  customers = signal<Customer[]>([]);

  customer: SaveCustomer = {};

  selectedCustomers: Customer[] | null = null;

  submitted: boolean = false;

  documentTypes: any[] = [];

  @ViewChild('dt') dt!: Table;

  exportColumns: ExportColumn[] = [];

  cols: Column[] = [];

  editingId: number | null = null;
  totalRecords: number = 0;
  loading: boolean = false;
  statusFilter: string | null = null;
  nameFilter: string = '';

  constructor(
    private customerService: CustomerService,
    private authorizationService: AuthorizationService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  canCreateCustomer(): boolean {
    return this.authorizationService.canDo('GESTION', 'CLIENTES', 'CREATE');
  }

  canUpdateCustomer(): boolean {
    return this.authorizationService.canDo('GESTION', 'CLIENTES', 'UPDATE');
  }

  canDeleteCustomer(): boolean {
    return this.authorizationService.canDo('GESTION', 'CLIENTES', 'DELETE');
  }

  canReactivateCustomer(): boolean {
    return this.authorizationService.canDo('GESTION', 'CLIENTES', 'REACTIVATE');
  }

  permissionTooltip(allowed: boolean): string {
    return allowed ? '' : 'No tienes permisos';
  }

  exportCSV() {
    this.dt.exportCSV();
  }

  ngOnInit() {
    this.loadData();
  }

  loadData(page: number = 0, size: number = 10, name?: string | null, status?: string | null) {
    const filter: CustomerFilter = { page, size };
    if (name) filter.name = name;
    if (status) filter.status = status;
    this.loading = true;

    this.customerService.listAll(filter).subscribe({
      next: ({ data }: ApiResponse<PageResponse<Customer>>) => {
        this.customers.set(data.content || []);
        this.totalRecords = data.totalElements || this.customers().length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar clientes' });
      }
    });

    this.documentTypes = [
      { label: 'DNI', value: 'DNI' },
      { label: 'RUC', value: 'RUC' }
    ];

    this.cols = [
      { field: 'id', header: 'Código' },
      { field: 'name', header: 'Nombre' },
      { field: 'address', header: 'Dirección' },
      { field: 'documentType', header: 'Tipo documento' },
      { field: 'documentNumber', header: 'Número documento' },
      { field: 'customerStatus', header: 'Estado' }
    ];

    this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
  }

  onGlobalFilter(table: Table, event: Event) {
    this.nameFilter = (event.target as HTMLInputElement).value;
    const size = table.rows ?? 10;
    // request page 0 with current filters
    this.loadData(0, size, this.nameFilter, this.statusFilter);
  }

  onPage(event: { first?: number; rows?: number; page?: number }) {
    const page = event.page ?? Math.floor((event.first ?? 0) / (event.rows ?? 10));
    const size = event.rows ?? 10;
    this.loadData(page, size, this.nameFilter, this.statusFilter);
  }

  onStatusChange() {
    const size = this.dt?.rows ?? 10;
    this.loadData(0, size, this.nameFilter, this.statusFilter);
  }

  openNew() {
    this.customer = {};
    this.submitted = false;
    this.editingId = null;
    this.productDialog = true;
  }

  editProduct(customer: Customer) {
    this.editingId = customer.id;
    this.customer = {
      name: customer.name,
      address: customer.address,
      contactName: customer.contact,
      contactPosition: customer.contactPosition,
      email: customer.email,
      cellphone: customer.cellphone,
      documentType: customer.documentType,
      documentNumber: customer.documentNumber,
      observations: customer.observations
    };
    this.productDialog = true;
  }

  deleteSelectedCustomers() {
    this.confirmationService.confirm({
      message: '¿Está seguro de eliminar los clientes seleccionados?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (!this.selectedCustomers || !this.selectedCustomers.length) return;

        const calls = this.selectedCustomers.map((c) => this.customerService.delete(c.id));
        forkJoin(calls).subscribe({
          next: () => {
            this.loadData();
            this.selectedCustomers = null;
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Clientes eliminados', life: 3000 });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar clientes' })
        });
      }
    });
  }

  hideDialog() {
    this.productDialog = false;
    this.submitted = false;
  }

  reactivateCustomer(customer: Customer) {
    this.confirmationService.confirm({
      message: '¿Está seguro de reactivar ' + customer.name + '?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.customerService.reactivate(customer.id).subscribe({
          next: () => {
            this.reloadCurrentPage();
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente reactivado', life: 3000 });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo reactivar cliente' })
        });
      }
    });
  }

  deleteProduct(customer: Customer) {
    this.confirmationService.confirm({
      message: '¿Está seguro de eliminar ' + customer.name + '?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.customerService.delete(customer.id).subscribe({
          next: () => {
            this.customers.set(this.customers().filter((val) => val.id !== customer.id));
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente eliminado', life: 3000 });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar cliente' })
        });
      }
    });
  }

  findIndexById(id: number): number {
    let index = -1;
    for (let i = 0; i < this.customers().length; i++) {
      if (this.customers()[i].id === id) {
        index = i;
        break;
      }
    }
    return index;
  }

  saveCustomer() {
    this.submitted = true;

    if (!this.customer || !this.customer.name) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Nombre es requerido' });
      return;
    }

    if (this.editingId) {
      this.customerService.update(this.editingId, this.customer).subscribe({
        next: ({ data }: ApiResponse<Customer>) => {
          const updated = data;
          this.customers.set(this.customers().map((c) => (c.id === updated.id ? updated : c)));
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente actualizado', life: 3000 });
          this.productDialog = false;
          this.customer = {};
          this.editingId = null;
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar cliente' })
      });
    } else {
      this.customerService.create(this.customer).subscribe({
        next: ({ data }: ApiResponse<Customer>) => {
          this.customers.set([data, ...this.customers()]);
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente creado', life: 3000 });
          this.productDialog = false;
          this.customer = {};
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear cliente' })
      });
    }
  }

  createId(): string {
    let id = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 5; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  getSeverity(status: string) {
    switch (status) {
      case 'INSTOCK':
        return 'success';
      case 'LOWSTOCK':
        return 'warn';
      case 'OUTOFSTOCK':
        return 'danger';
      default:
        return 'info';
    }
  }

  private reloadCurrentPage() {
    const size = this.dt?.rows ?? 10;
    const page = Math.floor((this.dt?.first ?? 0) / size);
    this.loadData(page, size, this.nameFilter, this.statusFilter);
  }
}
