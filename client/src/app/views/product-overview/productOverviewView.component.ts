import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import { CoreService } from '../../services/core.service';
import { Product } from '../../interfaces/core.interface';
import { Subscription } from 'rxjs';
import { NutritionLabelComponent } from '../../sharedComponents/nutritionLabel/nutritionLabel.component';
import { IngredientsTableComponent } from '../../sharedComponents/ingredientsTable/ingredientsTable.component';


@Component({
  selector: 'app-productOverviewView',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, NutritionLabelComponent,IngredientsTableComponent],
  templateUrl: './productOverviewView.component.html',
  styleUrl: './productOverviewView.component.scss'
})
export class ProductOverviewViewComponent implements OnInit, OnDestroy {

  product: Product | undefined;
  private subscription: Subscription | undefined;
  

  constructor(private route: ActivatedRoute, private router: Router, private coreService: CoreService){
    this.subscription = this.route.queryParams.subscribe((params: Params) => {

      if (params['id'] == null){
        this.router.navigate(['']);
      }
      this.coreService.getProductById(params['id']).subscribe(((product: Product | null) => {
        if (product == null){
          this.router.navigate(['']);
        } else {
          console.log("found product", product.barcode_id);
          this.product = product;
        }
      }));
    })
  }

  ngOnInit(): void {}

  ngOnDestroy(){
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

}
