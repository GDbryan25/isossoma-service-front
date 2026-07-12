import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TooltipModule } from 'primeng/tooltip';

import { ApiResponse } from '../../../models/ApiResponse';
import { PageResponse } from '../../../models/PageResponse';
import { CreateServiceItem } from '../../../models/ratecatalog/item/request/CreateServiceItem';
import { UpdateServiceItem } from '../../../models/ratecatalog/item/request/UpdateServiceItem';
import { CategoryResponse } from '../../../models/ratecatalog/category/CategoryResponse';
import { ServiceTypeResponse } from '../../../models/ratecatalog/service-type/ServiceTypeResponse';
import { SupplierListResponse } from '../../../models/ratecatalog/supplier/response/SupplierListResponse';
import { ItemWithSupplierResponse } from '../../../models/ratecatalog/item/response/ItemWithSupplierResponse';
import { CreateItemSupplier } from '../../../models/ratecatalog/item-supplier/request/CreateItemSupplier';
import { CreateServiceItemSupplier } from '../../../models/ratecatalog/item-supplier/request/CreateServiceItemSupplier';
import { UpdateItemSupplier } from '../../../models/ratecatalog/item-supplier/request/UpdateItemSupplier';
import { ItemSupplierResponse } from '../../../models/ratecatalog/item-supplier/response/ItemSupplierResponse';
import { CategoryService } from '../../../services/category.service';
import { ItemService } from '../../../services/item.service';
import { ItemSupplierService } from '../../../services/item-supplier.service';
import { ServiceTypeService } from '../../../services/service-type.service';
import { SupplierService } from '../../../services/supplier.service';
import { AuthorizationService } from '../../../services/authorization.service';
import { CanDirective } from '../../../shared/directives/can.directive';

interface ParameterTypeOption {
  label: string;
  value: 'LAB' | 'EQUIPMENT';
}

interface ItemSupplierDetail {
  id: number | null;
  status: string;
  supplierId: number | null;
  supplierDescription: string;
  methodology: string;
  accreditation: string;
  price: number | null;
  location: string;
}

interface DetailFormValue {
  supplierId: number | null;
  methodology: string;
  accreditation: string;
  price: number | null;
  location: string;
}

@Component({
  selector: 'app-item-supplier',
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, SelectModule, TextareaModule, ToolbarModule, DialogModule, TagModule, ToastModule, TooltipModule, CanDirective],
  providers: [MessageService],
  templateUrl: './item-supplier.component.html',
  styleUrl: './item-supplier.component.scss'
})
export class ItemSupplierComponent implements OnInit {
  serviceTypes = signal<ServiceTypeResponse[]>([]);
  categories = signal<CategoryResponse[]>([]);
  suppliers = signal<SupplierListResponse[]>([]);

  selectedServiceTypeId: number | null = null;
  selectedCategoryId: number | null = null;
  selectedParameterType: 'LAB' | 'EQUIPMENT' | null = null;
  description: string = '';
  additionalNote: string = '';
  detailDialogVisible: boolean = false;
  editingDetailIndex: number | null = null;
  currentItemId: number | null = null;

  detailForm: DetailFormValue = this.createEmptyDetailForm();

  parameterTypeOptions: ParameterTypeOption[] = [
    { label: 'LAB', value: 'LAB' },
    { label: 'EQUIPMENT', value: 'EQUIPMENT' }
  ];

  detailRows: ItemSupplierDetail[] = [];

  constructor(
    private route: ActivatedRoute,
    private serviceTypeService: ServiceTypeService,
    private categoryService: CategoryService,
    private itemService: ItemService,
    private itemSupplierService: ItemSupplierService,
    private supplierService: SupplierService,
    private authorizationService: AuthorizationService,
    private messageService: MessageService,
    private router: Router
  ) {}

  canCreateDetail(): boolean {
    return this.authorizationService.canDo('GESTION', 'TARIFARIOS', 'CREATE');
  }

  canUpdateDetail(): boolean {
    return this.authorizationService.canDo('GESTION', 'TARIFARIOS', 'UPDATE');
  }

  canDeleteDetail(): boolean {
    return this.authorizationService.canDo('GESTION', 'TARIFARIOS', 'DELETE');
  }

  canReactivateDetail(): boolean {
    return this.authorizationService.canDo('GESTION', 'TARIFARIOS', 'REACTIVATE');
  }

  canSaveItem(): boolean {
    return this.authorizationService.canDo('GESTION', 'TARIFARIOS', this.currentItemId === null ? 'CREATE' : 'UPDATE');
  }

  permissionTooltip(allowed: boolean): string {
    return allowed ? '' : 'No tienes permisos';
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        const id = Number(idParam);
        if (!Number.isNaN(id)) {
          this.currentItemId = id;
          this.loadEditData(id);
          return;
        }
      }

      this.currentItemId = null;
      this.initializeNewForm();
    });
  }

  loadServiceTypes(): void {
    this.serviceTypeService.findAll().subscribe({
      next: ({ data }: ApiResponse<ServiceTypeResponse[]>) => this.serviceTypes.set(data || []),
      error: () => this.serviceTypes.set([])
    });
  }

  initializeNewForm(): void {
    this.resetFormState();
    this.loadServiceTypes();
  }

  loadEditData(id: number): void {
    this.resetFormState();

    forkJoin({
      serviceTypes: this.serviceTypeService.findAll(),
      item: this.itemService.findById(id)
    }).subscribe({
      next: ({ serviceTypes, item }) => {
        this.serviceTypes.set(serviceTypes.data || []);
        this.mapItemToForm(item.data);
        this.loadDetailRowsByItemId(id);
      },
      error: () => {
        this.serviceTypes.set([]);
      }
    });
  }

  mapItemToForm(item: ItemWithSupplierResponse): void {
    this.selectedCategoryId = item.categoryId ?? null;
    this.selectedParameterType = item.parameterType === 'LAB' || item.parameterType === 'EQUIPMENT'
      ? item.parameterType
      : null;
    this.description = item.description ?? '';
    this.additionalNote = item.note ?? '';
    this.detailRows = (item.suppliers || []).map((supplier) => ({
      id: supplier.id,
      status: supplier.status,
      supplierId: null,
      supplierDescription: supplier.supplierDescription,
      methodology: supplier.methodology ?? '',
      accreditation: supplier.accreditation ?? '',
      price: supplier.price ?? null,
      location: supplier.location ?? ''
    }));

    this.resolveServiceTypeAndCategories(item.categoryId);
  }

  resolveServiceTypeAndCategories(categoryId: number): void {
    const serviceTypes = this.serviceTypes();

    if (!serviceTypes.length) {
      this.categories.set([]);
      this.selectedServiceTypeId = null;
      return;
    }

    const categoryCalls = serviceTypes.map((serviceType) => this.categoryService.findAll(serviceType.id));

    forkJoin(categoryCalls).subscribe({
      next: (responses) => {
        let found = false;

        for (let index = 0; index < responses.length; index++) {
          const categories = responses[index].data || [];
          if (categories.some((category) => category.categoryId === categoryId)) {
            this.selectedServiceTypeId = serviceTypes[index].id;
            this.categories.set(categories);
            found = true;
            break;
          }
        }

        if (!found) {
          this.selectedServiceTypeId = null;
          this.categories.set([]);
        }
      },
      error: () => {
        this.selectedServiceTypeId = null;
        this.categories.set([]);
      }
    });
  }

  onServiceTypeChange(): void {
    this.selectedCategoryId = null;
    this.categories.set([]);

    if (this.selectedServiceTypeId === null) {
      return;
    }

    this.categoryService.findAll(this.selectedServiceTypeId).subscribe({
      next: ({ data }: ApiResponse<CategoryResponse[]>) => this.categories.set(data || []),
      error: () => this.categories.set([])
    });
  }

  onAddDetail(): void {
    this.editingDetailIndex = null;
    this.detailForm = this.createEmptyDetailForm();
    this.detailDialogVisible = true;
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.supplierService.findAllList().subscribe({
      next: ({ data }: ApiResponse<SupplierListResponse[]>) => this.suppliers.set(data || []),
      error: () => this.suppliers.set([])
    });
  }

  closeDetailDialog(): void {
    this.detailDialogVisible = false;
    this.editingDetailIndex = null;
  }

  saveDetailFromDialog(): void {
    if (this.detailForm.supplierId === null) {
      return;
    }

    const selectedSupplier = this.suppliers().find((supplier) => supplier.id === this.detailForm.supplierId);
    if (!selectedSupplier) {
      return;
    }

    if (this.currentItemId !== null && this.editingDetailIndex === null) {
      const createRequest: CreateItemSupplier = {
        itemId: this.currentItemId,
        supplierId: selectedSupplier.id,
        price: this.detailForm.price ?? 0,
        methodology: this.detailForm.methodology.trim() || undefined,
        accreditation: this.detailForm.accreditation.trim() || undefined,
        location: this.detailForm.location.trim() || undefined
      };

      this.itemSupplierService.create(createRequest).subscribe({
        next: () => {
          this.detailDialogVisible = false;
          this.editingDetailIndex = null;
          this.detailForm = this.createEmptyDetailForm();
          this.loadDetailRowsByItemId(this.currentItemId!);
        },
        error: () => {}
      });
      return;
    }

    if (this.currentItemId !== null && this.editingDetailIndex !== null) {
      const detailId = this.detailRows[this.editingDetailIndex]?.id;
      if (detailId === null || detailId === undefined) {
        return;
      }

      const updateRequest: UpdateItemSupplier = {
        supplierId: selectedSupplier.id,
        price: this.detailForm.price ?? 0,
        methodology: this.detailForm.methodology.trim() || undefined,
        accreditation: this.detailForm.accreditation.trim() || undefined,
        location: this.detailForm.location.trim() || undefined
      };

      this.itemSupplierService.update(detailId, updateRequest).subscribe({
        next: () => {
          this.detailDialogVisible = false;
          this.editingDetailIndex = null;
          this.detailForm = this.createEmptyDetailForm();
          this.loadDetailRowsByItemId(this.currentItemId!);
        },
        error: () => {}
      });
      return;
    }

    const detailToSave: ItemSupplierDetail = {
      id: this.editingDetailIndex !== null ? this.detailRows[this.editingDetailIndex].id : null,
      status: this.editingDetailIndex !== null ? this.detailRows[this.editingDetailIndex].status : 'ACTIVE',
      supplierId: selectedSupplier.id,
      supplierDescription: selectedSupplier.name,
      methodology: this.detailForm.methodology.trim(),
      accreditation: this.detailForm.accreditation.trim(),
      price: this.detailForm.price,
      location: this.detailForm.location.trim()
    };

    if (this.editingDetailIndex !== null) {
      this.detailRows = this.detailRows.map((detail, index) => (index === this.editingDetailIndex ? detailToSave : detail));
    } else {
      this.detailRows = [...this.detailRows, detailToSave];
    }

    this.detailDialogVisible = false;
    this.editingDetailIndex = null;
    this.detailForm = this.createEmptyDetailForm();
  }

  onEditDetail(index: number): void {
    const detail = this.detailRows[index];
    this.editingDetailIndex = index;

    if (detail.id === null) {
      this.detailForm = {
        supplierId: detail.supplierId,
        methodology: detail.methodology,
        accreditation: detail.accreditation,
        price: detail.price,
        location: detail.location
      };
      this.detailDialogVisible = true;
      this.loadSuppliers();
      return;
    }

    forkJoin({
      suppliers: this.supplierService.findAllList(),
      detail: this.itemSupplierService.findById(detail.id)
    }).subscribe({
      next: ({ suppliers, detail }) => {
        this.suppliers.set(suppliers.data || []);
        this.detailForm = {
          supplierId: detail.data.supplierId ?? null,
          methodology: detail.data.methodology ?? '',
          accreditation: detail.data.accreditation ?? '',
          price: detail.data.price ?? null,
          location: detail.data.location ?? ''
        };
        this.detailDialogVisible = true;
      },
      error: () => {
        this.detailDialogVisible = false;
      }
    });
  }

  onDeleteDetail(index: number): void {
    const detail = this.detailRows[index];

    if (this.currentItemId !== null && detail.id !== null) {
      this.itemSupplierService.delete(detail.id).subscribe({
        next: () => {
          this.loadDetailRowsByItemId(this.currentItemId!);
        },
        error: () => {}
      });
      return;
    }

    this.detailRows = this.detailRows.filter((_, rowIndex) => rowIndex !== index);
  }

  onReactivateDetail(index: number): void {
    const detail = this.detailRows[index];

    if (this.currentItemId !== null && detail.id !== null) {
      this.itemSupplierService.reactivate(detail.id).subscribe({
        next: () => {
          this.loadDetailRowsByItemId(this.currentItemId!);
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Detalle reactivado', life: 3000 });
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo reactivar el detalle', life: 3000 });
        }
      });
      return;
    }

    this.detailRows = this.detailRows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, status: 'ACTIVE' } : row
    );
  }

  onSave(): void {
    if (this.selectedCategoryId === null || this.selectedParameterType === null || !this.description.trim()) {
      return;
    }

    if (this.currentItemId === null) {
      const supplierDetails: CreateServiceItemSupplier[] = this.detailRows
        .filter((detail) => detail.supplierId !== null)
        .map((detail) => ({
          supplierId: detail.supplierId!,
          methodology: detail.methodology.trim() || undefined,
          accreditation: detail.accreditation.trim() || undefined,
          price: detail.price ?? undefined,
          location: detail.location.trim() || undefined
        }));

      const createRequest: CreateServiceItem = {
        description: this.description.trim(),
        parameterType: this.selectedParameterType,
        note: this.additionalNote.trim() || undefined,
        serviceCategoryId: this.selectedCategoryId,
        suppliers: supplierDetails
      };

      this.itemService.create(createRequest).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Item creado correctamente', life: 3000 });
          this.navigateToItems();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el item', life: 3000 });
        }
      });

      return;
    }

    const request: UpdateServiceItem = {
      description: this.description.trim(),
      parameterType: this.selectedParameterType,
      note: this.additionalNote.trim() || undefined,
      serviceCategoryId: this.selectedCategoryId
    };

    this.itemService.update(this.currentItemId, request).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Item actualizado correctamente', life: 3000 });
        this.navigateToItems();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el item', life: 3000 });
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/gestion/tarifarios']);
  }

  resetFormState(): void {
    this.selectedServiceTypeId = null;
    this.selectedCategoryId = null;
    this.selectedParameterType = null;
    this.description = '';
    this.additionalNote = '';
    this.detailRows = [];
    this.detailDialogVisible = false;
    this.editingDetailIndex = null;
    this.detailForm = this.createEmptyDetailForm();
    this.categories.set([]);
    this.suppliers.set([]);
  }

  private createEmptyDetailForm(): DetailFormValue {
    return {
      supplierId: null,
      methodology: '',
      accreditation: '',
      price: null,
      location: ''
    };
  }

  private loadDetailRowsByItemId(itemId: number): void {
    this.itemSupplierService.search({ itemId }).subscribe({
      next: ({ data }: ApiResponse<PageResponse<ItemSupplierResponse>>) => {
        this.detailRows = (data.content || []).map((detail) => ({
          id: detail.id,
          status: detail.status,
          supplierId: null,
          supplierDescription: detail.supplierDescription,
          methodology: detail.methodology ?? '',
          accreditation: detail.accreditation ?? '',
          price: detail.price ?? null,
          location: detail.location ?? ''
        }));
      },
      error: () => {
        this.detailRows = [];
      }
    });
  }

  private navigateToItems(): void {
    setTimeout(() => {
      this.router.navigate(['/gestion/tarifarios']);
    }, 800);
  }

}
