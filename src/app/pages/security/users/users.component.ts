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

import { UserService } from '../../../services/user.service';
import { RoleService } from '../../../services/role.service';
import { UserResponse } from '../../../models/auth/users/response/UserResponse';
import { UserDetailResponse } from '../../../models/auth/users/response/UserDetailResponse';
import { CreateUserRequest } from '../../../models/auth/users/request/CreateUserRequest';
import { UpdateUserRequest } from '../../../models/auth/users/request/UpdateUserRequest';
import { RoleSimpleResponse } from '../../../models/auth/roles/response/RoleSimpleResponse';
import { UserPageableFilters } from '../../../models/auth/users/filters/UserPageableFilters';
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

interface SaveUser {
  username?: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  password?: string;
  roleIds: number[];
}

@Component({
  selector: 'app-users',
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
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  userDialog: boolean = false;
  users = signal<UserResponse[]>([]);
  user: SaveUser = { roleIds: [] };
  selectedUsers: UserResponse[] | null = null;
  submitted: boolean = false;
  statusFilter: string | null = null;
  firstnameFilter: string = '';
  lastnameFilter: string = '';
  roles: RoleSimpleResponse[] = [];
  @ViewChild('dt') dt!: Table;
  exportColumns: ExportColumn[] = [];
  cols: Column[] = [];
  editingId: number | null = null;
  totalRecords: number = 0;
  loading: boolean = false;

  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private authorizationService: AuthorizationService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  canCreateUser(): boolean {
    return this.authorizationService.canDo('SEGURIDAD', 'USUARIOS', 'CREATE');
  }

  canUpdateUser(): boolean {
    return this.authorizationService.canDo('SEGURIDAD', 'USUARIOS', 'UPDATE');
  }

  canDeleteUser(): boolean {
    return this.authorizationService.canDo('SEGURIDAD', 'USUARIOS', 'DELETE');
  }

  canReactivateUser(): boolean {
    return this.authorizationService.canDo('SEGURIDAD', 'USUARIOS', 'REACTIVATE');
  }

  permissionTooltip(allowed: boolean): string {
    return allowed ? '' : 'No tienes permisos';
  }

  exportCSV() {
    this.dt.exportCSV();
  }

  ngOnInit() {
    this.initializeColumns();
    this.loadRoles();
    this.loadData();
  }

  initializeColumns() {
    this.cols = [
      { field: 'id', header: 'ID' },
      { field: 'username', header: 'Usuario' },
      { field: 'email', header: 'Email' },
      { field: 'firstname', header: 'Nombre' },
      { field: 'lastname', header: 'Apellido' },
      { field: 'status', header: 'Estado' }
    ];
    this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
  }

  loadRoles() {
    this.roleService.findAll({ page: 0, size: 100, status: 'ACTIVE' }).subscribe({
      next: ({ data }: ApiResponse<PageResponse<RoleSimpleResponse>>) => {
        this.roles = data.content || [];
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar roles' });
      }
    });
  }

  loadData(page: number = 0, size: number = 10) {
    const filter: UserPageableFilters = { page, size };
    if (this.firstnameFilter?.trim()) {
      filter.firstname = this.firstnameFilter.trim();
    }
    if (this.lastnameFilter?.trim()) {
      filter.lastname = this.lastnameFilter.trim();
    }
    if (this.statusFilter) {
      filter.status = this.statusFilter;
    }

    this.loading = true;
    this.userService.findAll(filter).subscribe({
      next: ({ data }: ApiResponse<PageResponse<UserResponse>>) => {
        this.users.set(data.content || []);
        this.totalRecords = data.totalElements || this.users().length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar usuarios' });
      }
    });
  }

  onFirstNameFilter() {
    const size = this.dt?.rows ?? 10;
    this.loadData(0, size);
  }

  onLastNameFilter() {
    const size = this.dt?.rows ?? 10;
    this.loadData(0, size);
  }

  onStatusChange() {
    const size = this.dt?.rows ?? 10;
    this.loadData(0, size);
  }

  onPage(event: { first?: number; rows?: number; page?: number }) {
    const page = event.page ?? Math.floor((event.first ?? 0) / (event.rows ?? 10));
    const size = event.rows ?? 10;
    this.loadData(page, size);
  }

  openNew() {
    this.user = { roleIds: [] };
    this.submitted = false;
    this.editingId = null;
    this.userDialog = true;
  }

  editUser(user: UserResponse) {
    this.editingId = user.id;
    this.userService.findById(user.id).subscribe({
      next: ({ data }: ApiResponse<UserDetailResponse>) => {
        this.user = {
          username: data.username,
          email: data.email,
          firstname: data.firstname,
          lastname: data.lastname,
          roleIds: data.roles?.map((role) => role.id) || []
        };
        this.userDialog = true;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el usuario' });
      }
    });
  }

  deleteSelectedUsers() {
    this.confirmationService.confirm({
      message: '¿Está seguro de eliminar los usuarios seleccionados?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (!this.selectedUsers?.length) {
          return;
        }
        const calls = this.selectedUsers.map((user) => this.userService.delete(user.id));
        forkJoin(calls).subscribe({
          next: () => {
            this.reloadCurrentPage();
            this.selectedUsers = null;
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuarios eliminados', life: 3000 });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron eliminar usuarios' })
        });
      }
    });
  }

  hideDialog() {
    this.userDialog = false;
    this.submitted = false;
  }

  reactivateUser(user: UserResponse) {
    this.confirmationService.confirm({
      message: `¿Está seguro de reactivar ${user.username}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.userService.reactivate(user.id).subscribe({
          next: () => {
            this.reloadCurrentPage();
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario reactivado', life: 3000 });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo reactivar usuario' })
        });
      }
    });
  }

  deleteUser(user: UserResponse) {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar ${user.username}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.userService.delete(user.id).subscribe({
          next: () => {
            this.reloadCurrentPage();
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario eliminado', life: 3000 });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar usuario' })
        });
      }
    });
  }

  saveUser() {
    this.submitted = true;
    if (!this.user.username?.trim() || !this.user.email?.trim() || !this.user.firstname?.trim() || !this.user.lastname?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Completa los campos requeridos' });
      return;
    }

    if (this.editingId) {
      const payload: UpdateUserRequest = {
        username: this.user.username.trim(),
        email: this.user.email.trim(),
        firstname: this.user.firstname.trim(),
        lastname: this.user.lastname.trim(),
        roleIds: this.user.roleIds || []
      };
      this.userService.update(this.editingId, payload).subscribe({
        next: ({ data }: ApiResponse<UserResponse>) => {
          this.users.set(this.users().map((item) => (item.id === data.id ? data : item)));
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado', life: 3000 });
          this.userDialog = false;
          this.user = { roleIds: [] };
          this.editingId = null;
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar usuario' })
      });
    } else {
      if (!this.user.password?.trim()) {
        this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Password es requerido para crear usuario' });
        return;
      }
      const payload: CreateUserRequest = {
        username: this.user.username.trim(),
        email: this.user.email.trim(),
        firstname: this.user.firstname.trim(),
        lastname: this.user.lastname.trim(),
        password: this.user.password.trim(),
        roleIds: this.user.roleIds || []
      };
      this.userService.create(payload).subscribe({
        next: ({ data }: ApiResponse<UserResponse>) => {
          this.users.set([data, ...this.users()]);
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario creado', life: 3000 });
          this.userDialog = false;
          this.user = { roleIds: [] };
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear usuario' })
      });
    }
  }

  private reloadCurrentPage() {
    const size = this.dt?.rows ?? 10;
    const page = Math.floor((this.dt?.first ?? 0) / size);
    this.loadData(page, size);
  }
}
