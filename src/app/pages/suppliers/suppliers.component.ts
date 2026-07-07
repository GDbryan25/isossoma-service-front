import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { forkJoin } from 'rxjs';

import { CreateSupplierRequest } from '../../models/raatecatalog/supplier/request/CreateSupplierRequest';
import { UpdateSupplierRequest } from '../../models/raatecatalog/supplier/request/UpdateSupplierRequest';
import { SupplierResponse } from '../../models/raatecatalog/supplier/response/SupplierResponse';
import { SupplierService } from '../../services/supplier.service';
import { SupplierFilter } from '../../models/raatecatalog/supplier/filters/SupplierFilter';
import { PageResponse } from '../../models/PageResponse';
import { ApiResponse } from '../../models/ApiResponse';

interface Column {
  field: string;
  header: string;
}

interface ExportColumn {
  title: string;
  dataKey: string;
}

interface SaveSupplier {
  name?: string;
  note?: string;
}

@Component({
  selector: 'app-suppliers',
  imports: [
    CommonModule,
    TableModule,
    FormsModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    ToolbarModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    RadioButtonModule,
    DialogModule,
    TagModule,
    ConfirmDialogModule,
    InputIconModule,
    IconFieldModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.scss'
})
export class SuppliersComponent implements OnInit {
  supplierDialog: boolean = false;
  suppliers = signal<SupplierResponse[]>([]);
  supplier: SaveSupplier = {};
  selectedSuppliers: SupplierResponse[] | null = null;
  submitted: boolean = false;
  statusFilter: string | null = null;
  nameFilter: string = '';
  @ViewChild('dt') dt!: Table;
  exportColumns: ExportColumn[] = [];
  cols: Column[] = [];
  editingId: number | null = null;
  totalRecords: number = 0;
  loading: boolean = false;

  constructor(
    private supplierService: SupplierService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  exportCSV() {
    this.dt.exportCSV();
  }

  ngOnInit() {
    this.initializeColumns();
    this.loadData();
  }

  initializeColumns() {
    this.cols = [
      { field: 'id', header: 'ID' },
      { field: 'name', header: 'Nombre' },
      { field: 'note', header: 'Nota' },
      { field: 'status', header: 'Estado' }
    ];
    this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
  }

  loadData(page: number = 0, size: number = 10, name: string | null = null, status: string | null = null) {
    const filter: SupplierFilter = { page, size };
    if (name?.trim()) {
      filter.name = name.trim();
    }
    if (status) {
      filter.status = status;
    }

    this.loading = true;
    this.supplierService.findAll(filter).subscribe({
      next: ({ data }: ApiResponse<PageResponse<SupplierResponse>>) => {
        this.suppliers.set(data.content || []);
        this.totalRecords = data.totalElements || this.suppliers().length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar proveedores' });
      }
    });
  }

  onGlobalFilter(table: Table, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.nameFilter = value;
    const size = table.rows ?? 10;
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
    this.supplier = {};
    this.submitted = false;
    this.editingId = null;
    this.supplierDialog = true;
  }

  editSupplier(supplier: SupplierResponse) {
    this.editingId = supplier.id;
    this.supplier = {
      name: supplier.name,
      note: supplier.note
    };
    this.supplierDialog = true;
  }

  deleteSelectedSuppliers() {
    this.confirmationService.confirm({
      message: '¿Está seguro de eliminar los proveedores seleccionados?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (!this.selectedSuppliers?.length) {
          return;
        }
        const calls = this.selectedSuppliers.map((supplier) => this.supplierService.delete(supplier.id));
        forkJoin(calls).subscribe({
          next: () => {
            this.loadData();
            this.selectedSuppliers = null;
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Proveedores eliminados', life: 3000 });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron eliminar proveedores' })
        });
      }
    });
  }

  hideDialog() {
    this.supplierDialog = false;
    this.submitted = false;
  }

  deleteSupplier(supplier: SupplierResponse) {
    this.confirmationService.confirm({
      message: '¿Está seguro de eliminar ' + supplier.name + '?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.supplierService.delete(supplier.id).subscribe({
          next: () => {
            this.suppliers.set(this.suppliers().filter((item) => item.id !== supplier.id));
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Proveedor eliminado', life: 3000 });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar proveedor' })
        });
      }
    });
  }

  saveSupplier() {
    this.submitted = true;
    if (!this.supplier?.name?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'El nombre es requerido' });
      return;
    }

    const payload: CreateSupplierRequest | UpdateSupplierRequest = {
      name: this.supplier.name.trim(),
      note: this.supplier.note?.trim() ?? ''
    };

    if (this.editingId) {
      this.supplierService.update(this.editingId, payload).subscribe({
        next: ({ data }: ApiResponse<SupplierResponse>) => {
          this.suppliers.set(this.suppliers().map((item) => (item.id === data.id ? data : item)));
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Proveedor actualizado', life: 3000 });
          this.supplierDialog = false;
          this.supplier = {};
          this.editingId = null;
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar proveedor' })
      });
    } else {
      this.supplierService.create(payload).subscribe({
        next: ({ data }: ApiResponse<SupplierResponse>) => {
          this.suppliers.set([data, ...this.suppliers()]);
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Proveedor creado', life: 3000 });
          this.supplierDialog = false;
          this.supplier = {};
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear proveedor' })
      });
    }
  }
}
