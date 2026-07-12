import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Router } from '@angular/router';

import { ItemService } from '../../../services/item.service';
import { CategoryService } from '../../../services/category.service';
import { ServiceTypeService } from '../../../services/service-type.service';
import { SupplierService } from '../../../services/supplier.service';
import { ServiceItemFilter } from '../../../models/ratecatalog/item/filters/ServiceItemFilter';
import { ItemResponse } from '../../../models/ratecatalog/item/response/ItemResponse';
import { PageResponse } from '../../../models/PageResponse';
import { ApiResponse } from '../../../models/ApiResponse';
import { CategoryResponse } from '../../../models/ratecatalog/category/CategoryResponse';
import { ServiceTypeResponse } from '../../../models/ratecatalog/service-type/ServiceTypeResponse';
import { SupplierResponse } from '../../../models/ratecatalog/supplier/response/SupplierResponse';
import { forkJoin } from 'rxjs';
import { AuthorizationService } from '../../../services/authorization.service';
import { CanDirective } from '../../../shared/directives/can.directive';

interface Column {
  field: string;
  header: string;
}

interface ExportColumn {
  title: string;
  dataKey: string;
}

@Component({
  selector: 'app-items',
  imports: [
    CommonModule,
    TableModule,
    FormsModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    ToolbarModule,
    InputTextModule,
    SelectModule,
    RadioButtonModule,
    TagModule,
    ConfirmDialogModule,
    InputIconModule,
    IconFieldModule,
    TooltipModule,
    CanDirective
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './items.component.html',
  styleUrl: './items.component.scss'
})
export class ItemsComponent implements OnInit {
  items = signal<ItemResponse[]>([]);
  selectedItems: ItemResponse[] | null = null;
  serviceTypes = signal<ServiceTypeResponse[]>([]);
  categories = signal<CategoryResponse[]>([]);
  suppliers = signal<SupplierResponse[]>([]);
  selectedServiceTypeId: number | null = null;
  selectedCategoryId: number | null = null;
  selectedSupplierId: number | null = null;
  statusFilter: string | null = null;
  descriptionFilter: string = '';
  @ViewChild('dt') dt!: Table;
  cols: Column[] = [];
  exportColumns: ExportColumn[] = [];
  totalRecords: number = 0;
  loading: boolean = false;

  constructor(
    private itemService: ItemService,
    private categoryService: CategoryService,
    private serviceTypeService: ServiceTypeService,
    private supplierService: SupplierService,
    private authorizationService: AuthorizationService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  canCreateItem(): boolean {
    return this.authorizationService.canDo('GESTION', 'TARIFARIOS', 'CREATE');
  }

  canUpdateItem(): boolean {
    return this.authorizationService.canDo('GESTION', 'TARIFARIOS', 'UPDATE');
  }

  canDeleteItem(): boolean {
    return this.authorizationService.canDo('GESTION', 'TARIFARIOS', 'DELETE');
  }

  canReactivateItem(): boolean {
    return this.authorizationService.canDo('GESTION', 'TARIFARIOS', 'REACTIVATE');
  }

  permissionTooltip(allowed: boolean): string {
    return allowed ? '' : 'No tienes permisos';
  }

  ngOnInit() {
    this.initializeColumns();
    this.loadLookupData();
    this.loadData();
  }

  initializeColumns() {
    this.cols = [
      { field: 'id', header: 'ID' },
      { field: 'description', header: 'Descripción' },
      { field: 'parameterType', header: 'Tipo' },
      { field: 'categoryDescription', header: 'Categoría' },
      { field: 'status', header: 'Estado' }
    ];
    this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
  }

  loadLookupData() {
    this.serviceTypeService.findAll().subscribe({
      next: ({ data }: ApiResponse<ServiceTypeResponse[]>) => this.serviceTypes.set(data || []),
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar tipos de servicio' })
    });

    this.supplierService.findAll({ status: 'ACTIVE', page: 0, size: 100 }).subscribe({
      next: ({ data }: ApiResponse<PageResponse<SupplierResponse>>) => this.suppliers.set(data.content || []),
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar proveedores' })
    });
  }

  loadCategories() {
    if (this.selectedServiceTypeId === null) {
      this.categories.set([]);
      return;
    }

    this.categoryService.findAll(this.selectedServiceTypeId).subscribe({
      next: ({ data }: ApiResponse<CategoryResponse[]>) => this.categories.set(data || []),
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar categorías' })
    });
  }

  loadData(page: number = 0, size: number = 10) {
    const filter: ServiceItemFilter = { page, size } as ServiceItemFilter;
    if (this.descriptionFilter?.trim()) {
      filter.description = this.descriptionFilter.trim();
    }
    if (this.statusFilter) {
      filter.status = this.statusFilter;
    }
    if (this.selectedCategoryId !== null) {
      filter.categoryId = this.selectedCategoryId;
    }
    if (this.selectedSupplierId !== null) {
      filter.supplierId = this.selectedSupplierId;
    }

    this.loading = true;
    this.itemService.search(filter, page, size).subscribe({
      next: ({ data }: ApiResponse<PageResponse<ItemResponse>>) => {
        this.items.set(data.content || []);
        this.totalRecords = data.totalElements || this.items().length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar items' });
      }
    });
  }

  exportCSV() {
    this.dt.exportCSV();
  }

  onGlobalFilter(table: Table, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.descriptionFilter = value;
    const size = table.rows ?? 10;
    this.loadData(0, size);
  }

  onPage(event: { first?: number; rows?: number; page?: number }) {
    const page = event.page ?? Math.floor((event.first ?? 0) / (event.rows ?? 10));
    const size = event.rows ?? 10;
    this.loadData(page, size);
  }

  onServiceTypeChange() {
    this.selectedCategoryId = null;
    this.loadCategories();
    const size = this.dt?.rows ?? 10;
    this.loadData(0, size);
  }

  onCategoryChange() {
    const size = this.dt?.rows ?? 10;
    this.loadData(0, size);
  }

  onSupplierChange() {
    const size = this.dt?.rows ?? 10;
    this.loadData(0, size);
  }

  onStatusChange() {
    const size = this.dt?.rows ?? 10;
    this.loadData(0, size);
  }

  clearServiceTypeFilter() {
    this.selectedServiceTypeId = null;
    this.selectedCategoryId = null;
    this.categories.set([]);
    const size = this.dt?.rows ?? 10;
    this.loadData(0, size);
  }

  clearCategoryFilter() {
    this.selectedCategoryId = null;
    const size = this.dt?.rows ?? 10;
    this.loadData(0, size);
  }

  clearSupplierFilter() {
    this.selectedSupplierId = null;
    const size = this.dt?.rows ?? 10;
    this.loadData(0, size);
  }

  clearAllFilters() {
    this.selectedServiceTypeId = null;
    this.selectedCategoryId = null;
    this.selectedSupplierId = null;
    this.statusFilter = null;
    this.descriptionFilter = '';
    this.categories.set([]);
    const size = this.dt?.rows ?? 10;
    this.loadData(0, size);
  }

  openNew() {
    this.router.navigate(['/gestion/tarifarios/item-supplier']);
  }

  editItem(item: ItemResponse) {
    this.router.navigate(['/gestion/tarifarios/item-supplier'], { queryParams: { id: item.id } });
  }

  deleteSelectedItems() {
    this.confirmationService.confirm({
      message: '¿Está seguro de eliminar los items seleccionados?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (!this.selectedItems?.length) {
          return;
        }
        const calls = this.selectedItems.map((item) => this.itemService.delete(item.id));
        forkJoin(calls).subscribe({
          next: () => {
            this.reloadCurrentPage();
            this.selectedItems = null;
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Items eliminados', life: 3000 });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron eliminar items' })
        });
      }
    });
  }

  deleteItem(item: ItemResponse) {
    const name = item.description || item.id;
    this.confirmationService.confirm({
      message: '¿Está seguro de eliminar ' + name + '?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.itemService.delete(item.id).subscribe({
          next: () => {
            this.reloadCurrentPage();
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Item eliminado', life: 3000 });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar item' })
        });
      }
    });
  }

  reactivateItem(item: ItemResponse) {
    const name = item.description || item.id;
    this.confirmationService.confirm({
      message: '¿Está seguro de reactivar ' + name + '?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.itemService.reactivate(item.id).subscribe({
          next: () => {
            this.reloadCurrentPage();
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Item reactivado', life: 3000 });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo reactivar item' })
        });
      }
    });
  }

  private reloadCurrentPage() {
    const size = this.dt?.rows ?? 10;
    const page = Math.floor((this.dt?.first ?? 0) / size);
    this.loadData(page, size);
  }
}
