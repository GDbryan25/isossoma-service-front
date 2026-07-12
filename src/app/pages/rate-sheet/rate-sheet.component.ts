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
import { Product, ProductService } from '../service/product.service';
import { SaveCustomer } from '../../models/customers/request/SaveCustomer';
import { Customer } from '../../models/customers/response/Customer';
import { ServiceCategory } from '../../models/pricing/response/ServiceCategory';
import { PricingService } from '../service/pricing.service';

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
  selector: 'app-rate-sheet',
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
        ConfirmDialogModule
  ],
  providers: [ MessageService, ProductService, ConfirmationService ],
  templateUrl: './rate-sheet.component.html',
  styleUrl: './rate-sheet.component.scss'
})
export class RateSheetComponent {
    pricingDialog: boolean = false;

    ratePlans = signal<ServiceCategory[]>([]);

    rateplan!: SaveCustomer;

    selectedRatePlans!: ServiceCategory[] | null;

    submitted: boolean = false;

    documentTypes!: any[];

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];

    constructor(
        private productService: ProductService,
        private pricingService: PricingService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.ratePlans.set(this.pricingService.getDemoData());

        this.cols = [
            { field: 'code', header: 'Code', customExportHeader: 'Product Code' },
            { field: 'name', header: 'Name' },
            { field: 'image', header: 'Image' },
            { field: 'price', header: 'Price' },
            { field: 'category', header: 'Category' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.rateplan = {};
        this.submitted = false;
        this.pricingDialog = true;
    }

    editProduct(product: Product) {
        this.rateplan = { ...product };
        this.pricingDialog = true;
    }

    deleteSelectedRatePlans() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected products?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.ratePlans.set(this.ratePlans().filter((val) => !this.selectedRatePlans?.includes(val)));
                this.selectedRatePlans = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Products Deleted',
                    life: 3000
                });
            }
        });
    }

    deleteProduct(product: Product) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete ' + product.name + '?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                // this.customers.set(this.customers().filter((val) => val.id !== product.id));
                this.rateplan = {};
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Product Deleted',
                    life: 3000
                });
            }
        });
    }

    findIndexById(id: string): number {
        let index = -1;
        // for (let i = 0; i < this.customers().length; i++) {
        //     if (this.customers()[i].id === id) {
        //         index = i;
        //         break;
        //     }
        // }

        return index;
    }

    saveCustomer() {
        // this.submitted = true;
        // let _products = this.products();
        // if (this.product.name?.trim()) {
        //     if (this.product.id) {
        //         _products[this.findIndexById(this.product.id)] = this.product;
        //         this.products.set([..._products]);
        //         this.messageService.add({
        //             severity: 'success',
        //             summary: 'Successful',
        //             detail: 'Product Updated',
        //             life: 3000
        //         });
        //     } else {
        //         this.product.id = this.createId();
        //         this.product.image = 'product-placeholder.svg';
        //         this.messageService.add({
        //             severity: 'success',
        //             summary: 'Successful',
        //             detail: 'Product Created',
        //             life: 3000
        //         });
        //         this.products.set([..._products, this.product]);
        //     }

        //     this.productDialog = false;
        //     this.product = {};
        // }
    }
}