import { Component, Input, OnInit } from '@angular/core';
import {MatTableModule} from '@angular/material/table';


export interface PeriodicElement {
  name: string;
  position: number;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {position: 1, name: 'Chicken stock'},
  {position: 2, name: 'Cream'},
  {position: 3, name: 'Carrots'},
  {position: 4, name: 'Chicken Meat'},
  {position: 5, name: 'Celery'},
  {position: 6, name: 'Enriched Egg Noodles'},
  {position: 7, name: 'Wheat flour'},
  {position: 8, name: 'Egg whites'},
  {position: 9, name: 'Eggs'},
  {position: 10, name: 'Niacin'},
  {position: 11, name: 'Ferrous sulfate'},
  {position: 12, name: 'Thiamine monitrate'},
  {position: 13, name: 'Riboflavin'},
  {position: 14, name: 'Folic acid'},
  {position: 15, name: 'Vegetable oil'},
  {position: 16, name: 'Modified Cornstarch'},
  {position: 17, name: 'Salt'},
  {position: 18, name: 'Oxygen'},
  {position: 19, name: 'Dried Onions'},
  {position: 20, name: 'Soy protien concentrate'},
  {position: 21, name: 'Soy protien isolate'},
  {position: 22, name: 'Sodium Phosphate'},
  {position: 23, name: 'Sugar'}
];


@Component({
  selector: 'app-ingredientsTable',
  templateUrl: './ingredientsTable.component.html',
  standalone: true,
  styleUrls: ['./ingredientsTable.component.scss'],
  imports: [MatTableModule],

})
export class IngredientsTableComponent implements OnInit {
  
  displayedColumns: string[] = ['position', 'name'];
  dataSource = ELEMENT_DATA;

  ngOnInit(): void {
  }
}
