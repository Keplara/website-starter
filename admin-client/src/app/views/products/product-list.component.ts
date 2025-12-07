import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { ConfirmDeleteDialogComponent } from '../users/confirm-delete-dialog.component';

export interface Product {
  name: string;
  sku: string;
  price: number;
  createdOn: string;
  modifiedOn: string;
  createdBy: string;
  modifiedBy: string;
  avatar?: string;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatListModule, MatButtonModule, RouterLink, ConfirmDeleteDialogComponent],
  templateUrl: './product-list.component.html'
})
export class ProductListComponent {
  products: Product[] = [
    {
      name: 'Widget A',
      sku: 'WIDG-A',
      price: 19.99,
      createdOn: '2025-01-01',
      modifiedOn: '2025-06-01',
      createdBy: 'admin',
      modifiedBy: 'admin',
      avatar: 'https://randomuser.me/api/portraits/men/10.jpg'
    },
    {
      name: 'Widget B',
      sku: 'WIDG-B',
      price: 29.99,
      createdOn: '2025-02-15',
      modifiedOn: '2025-05-20',
      createdBy: 'admin',
      modifiedBy: 'jdoe',
      avatar: 'https://randomuser.me/api/portraits/women/11.jpg'
    },
    {
      name: 'Gadget X',
      sku: 'GADX',
      price: 49.99,
      createdOn: '2025-03-10',
      modifiedOn: '2025-07-01',
      createdBy: 'asmith',
      modifiedBy: 'jdoe',
      avatar: 'https://randomuser.me/api/portraits/men/12.jpg'
    },
    {
      name: 'Gadget Y',
      sku: 'GADY',
      price: 59.99,
      createdOn: '2025-04-12',
      modifiedOn: '2025-08-15',
      createdBy: 'bwayne',
      modifiedBy: 'asmith',
      avatar: 'https://randomuser.me/api/portraits/men/13.jpg'
    },
    {
      name: 'Thing Z',
      sku: 'THNZ',
      price: 99.99,
      createdOn: '2025-05-20',
      modifiedOn: '2025-09-10',
      createdBy: 'ckent',
      modifiedBy: 'bwayne',
      avatar: 'https://randomuser.me/api/portraits/women/14.jpg'
    }
  ];

  constructor(private dialog: MatDialog, private router: Router) {}

  editProduct(product: Product) {
    this.router.navigate([product.sku, 'edit'], { relativeTo: undefined });
  }

  confirmDelete(product: Product) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Product deleted:', product);
      }
    });
  }
}
