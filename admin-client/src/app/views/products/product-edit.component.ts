import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

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
  constructor(private route: ActivatedRoute, private router: Router) {
    this.sku = this.route.snapshot.paramMap.get('id');
  }
  goBack() {
    this.router.navigate(['../../'], { relativeTo: this.route });
  }
}
