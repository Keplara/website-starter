import { Component } from '@angular/core';

@Component({
  selector: 'app-product-create',
  standalone: true,
  template: `
    <h3>Create Product</h3>
    <form>
      <label>Name: <input type="text" name="name"></label><br>
      <label>SKU: <input type="text" name="sku"></label><br>
      <label>Price: <input type="number" name="price"></label><br>
      <button type="submit">Create</button>
    </form>
  `
})
export class ProductCreateComponent {}
