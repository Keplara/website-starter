import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ManagementService } from '../../services/resource.service';

@Component({
  selector: 'app-product-edit',
  standalone: true,
  template: `
    <h3>Edit Product</h3>
    <button (click)="goBack()">Back</button>
    <p>Editing product with SKU: {{ sku }}</p>
    <form>
      <label>Name: <input type="text" name="name"></label><br>
      <label>Price: <input type="number" name="price"></label><br>
      <button type="submit">Save</button>
    </form>
  `
})
export class ProductEditComponent {
  sku: string | null = null;
  name: string = '';
  price: number | null = null;

  constructor(private route: ActivatedRoute, private router: Router, private resourceService: ManagementService) {
    this.sku = this.route.snapshot.paramMap.get('id');
    if (this.sku) {
      this.getProduct(this.sku);
    } else {
      this.getProduct("32423"); // For testing purpose
      console.error('No SKU provided in route');
    }
  }

  getProduct(sku: string) {
    this.resourceService.getProductBySku(sku).subscribe({
      next: (product: any) => {
        this.name = product?.name ?? '';
        this.price = typeof product?.price === 'number' ? product.price : null;
      },
      error: (err) => {
        console.error('Failed to load product', err);
      }
    });
  }

  goBack() {
    this.router.navigate(['../../'], { relativeTo: this.route });
  }
}
