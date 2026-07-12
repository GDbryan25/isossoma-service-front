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
import { MultiSelectModule } from 'primeng/multiselect';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';

import { RoleService } from '../../../services/role.service';
import { PermissionService } from '../../../services/permission.service';
import { RoleSimpleResponse } from '../../../models/auth/roles/response/RoleSimpleResponse';
import { RoleDetailResponse } from '../../../models/auth/roles/response/RoleDetailResponse';
import { CreateRoleRequest } from '../../../models/auth/roles/request/CreateRoleRequest';
import { UpdateRoleRequest } from '../../../models/auth/roles/request/UpdateRoleRequest';
import { PermissionResponse } from '../../../models/auth/permissions/PermissionResponse';
import { RoleFilters } from '../../../models/auth/roles/filters/RoleFilters';
import { PageResponse } from '../../../models/PageResponse';
import { ApiResponse } from '../../../models/ApiResponse';
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

interface SaveRole {
  name?: string;
  description?: string;
  permissionIds: number[];
}

@Component({
  selector: 'app-roles',
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
    MultiSelectModule,
    RadioButtonModule,
    DialogModule,
    TagModule,
    InputIconModule,
    IconFieldModule,
    TooltipModule,
    CanDirective,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss'
})
export class RolesComponent implements OnInit {
  roleDialog: boolean = false;
  roles = signal<RoleSimpleResponse[]>([]);
  role: SaveRole = { permissionIds: [] };
  selectedRoles: RoleSimpleResponse[] | null = null;
  submitted: boolean = false;
  statusFilter: string | null = null;
  nameFilter: string = '';
  permissions: PermissionResponse[] = [];
  selectedPermissions: PermissionResponse[] = [];
  @ViewChild('dt') dt!: Table;
  exportColumns: ExportColumn[] = [];
  cols: Column[] = [];
  editingId: number | null = null;
  totalRecords: number = 0;
  loading: boolean = false;

  constructor(
    private roleService: RoleService,
    private permissionService: PermissionService,
    private authorizationService: AuthorizationService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  canCreateRole(): boolean {
    return this.authorizationService.canDo('SEGURIDAD', 'ROLES', 'CREATE');
  }

  canUpdateRole(): boolean {
    return this.authorizationService.canDo('SEGURIDAD', 'ROLES', 'UPDATE');
  }

  canDeleteRole(): boolean {
    return this.authorizationService.canDo('SEGURIDAD', 'ROLES', 'DELETE');
  }

  canReactivateRole(): boolean {
    return this.authorizationService.canDo('SEGURIDAD', 'ROLES', 'REACTIVATE');
  }

  permissionTooltip(allowed: boolean): string {
    return allowed ? '' : 'No tienes permisos';
  }

  exportCSV() {
    this.dt.exportCSV();
  }

  ngOnInit() {
    this.initializeColumns();
    this.loadPermissions();
    this.loadData();
  }

  initializeColumns() {
    this.cols = [
      { field: 'id', header: 'ID' },
      { field: 'name', header: 'Nombre' },
      { field: 'description', header: 'Descripción' },
      { field: 'status', header: 'Estado' }
    ];
    this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
  }

  loadPermissions() {
    this.permissionService.findAll().subscribe({
      next: ({ data }: ApiResponse<PermissionResponse[]>) => {
        this.permissions = data || [];
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar permisos' });
      }
    });
  }

  loadData(page: number = 0, size: number = 10, name: string | null = null, status: string | null = null) {
    const filter: RoleFilters = { page, size };
    if (name?.trim()) {
      filter.name = name.trim();
    }
    if (status) {
      filter.status = status;
    }

    this.loading = true;
    this.roleService.findAll(filter).subscribe({
      next: ({ data }: ApiResponse<PageResponse<RoleSimpleResponse>>) => {
        this.roles.set(data.content || []);
        this.totalRecords = data.totalElements || this.roles().length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar roles' });
      }
    });
  }

  onGlobalFilter(table: Table, event: Event) {
    this.nameFilter = (event.target as HTMLInputElement).value;
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
    this.role = { permissionIds: [] };
    this.selectedPermissions = [];
    this.submitted = false;
    this.editingId = null;
    this.roleDialog = true;
  }

  editRole(role: RoleSimpleResponse) {
    this.editingId = role.id;
    this.roleService.findById(role.id).subscribe({
      next: ({ data }: ApiResponse<RoleDetailResponse>) => {
        this.role = {
          name: data.name,
          description: data.description,
          permissionIds: data.permissions?.map((permission) => permission.id) || []
        };
        this.selectedPermissions = data.permissions || [];
        this.roleDialog = true;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el rol' });
      }
    });
  }

  deleteSelectedRoles() {
    this.confirmationService.confirm({
      message: '¿Está seguro de eliminar los roles seleccionados?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (!this.selectedRoles?.length) {
          return;
        }
        const calls = this.selectedRoles.map((role) => this.roleService.delete(role.id));
        forkJoin(calls).subscribe({
          next: () => {
            this.reloadCurrentPage();
            this.selectedRoles = null;
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Roles eliminados', life: 3000 });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron eliminar roles' })
        });
      }
    });
  }

  hideDialog() {
    this.roleDialog = false;
    this.submitted = false;
  }

  reactivateRole(role: RoleSimpleResponse) {
    this.confirmationService.confirm({
      message: `¿Está seguro de reactivar ${role.name}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.roleService.reactivate(role.id).subscribe({
          next: () => {
            this.reloadCurrentPage();
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Rol reactivado', life: 3000 });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo reactivar rol' })
        });
      }
    });
  }

  deleteRole(role: RoleSimpleResponse) {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar ${role.name}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.roleService.delete(role.id).subscribe({
          next: () => {
            this.reloadCurrentPage();
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Rol eliminado', life: 3000 });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar rol' })
        });
      }
    });
  }

  saveRole() {
    this.submitted = true;
    if (!this.role.name?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'El nombre es requerido' });
      return;
    }

    const payload: CreateRoleRequest | UpdateRoleRequest = {
      name: this.role.name.trim(),
      description: this.role.description?.trim() ?? '',
      permissionIds: this.role.permissionIds || []
    };

    if (this.editingId) {
      this.roleService.update(this.editingId, payload).subscribe({
        next: ({ data }: ApiResponse<RoleSimpleResponse>) => {
          this.roles.set(this.roles().map((item) => (item.id === data.id ? data : item)));
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Rol actualizado', life: 3000 });
          this.roleDialog = false;
          this.role = { permissionIds: [] };
          this.editingId = null;
          this.selectedPermissions = [];
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar rol' })
      });
    } else {
      this.roleService.create(payload).subscribe({
        next: ({ data }: ApiResponse<RoleSimpleResponse>) => {
          this.roles.set([data, ...this.roles()]);
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Rol creado', life: 3000 });
          this.roleDialog = false;
          this.role = { permissionIds: [] };
          this.selectedPermissions = [];
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear rol' })
      });
    }
  }

  private reloadCurrentPage() {
    const size = this.dt?.rows ?? 10;
    const page = Math.floor((this.dt?.first ?? 0) / size);
    this.loadData(page, size, this.nameFilter, this.statusFilter);
  }
}
