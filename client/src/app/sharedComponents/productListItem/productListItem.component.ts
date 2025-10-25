import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Product } from '../../interfaces/core.interface';
import { Router } from '@angular/router';
import { CoreService } from '../../services/core.service';

@Component({
    selector: 'productListItem',
    templateUrl: 'productListItem.component.html',
    styleUrl: "./productListItem.component.scss",
    standalone: true,
    imports: [CommonModule, MatListModule, MatButtonModule, MatIconModule,],
})
export class ProductListItem implements OnInit {
    @Input() product!: Product;
    constructor(private router: Router, private coreService: CoreService) { }

    ngOnInit() {}

    onClick() {
        this.coreService.resetSearchResults();
        this.router.navigate(["/product"], { queryParams: {id: this.product._id } });
    }
}