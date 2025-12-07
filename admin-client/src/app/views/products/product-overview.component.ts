import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-product-overview',
  standalone: true,
  template: `
    <h3>Product Overview</h3>
    <p>Details for product with SKU: {{ sku }}</p>
  `
})
export class ProductOverviewComponent {
  sku: string | null = null;
  constructor(private route: ActivatedRoute) {
    this.sku = this.route.snapshot.paramMap.get('id');
  }
}
