import { Routes } from '@angular/router';
import { HomeViewComponent } from './views/home/homeView.component';
import { ProductOverviewViewComponent } from './views/product-overview/productOverviewView.component';

export const routes: Routes = [
    {
        path: "",
        component: HomeViewComponent,
    },
    {
        path: "product",
        component: ProductOverviewViewComponent,
    }
];
