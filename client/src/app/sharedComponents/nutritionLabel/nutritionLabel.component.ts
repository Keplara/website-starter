import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-nutritionLabel',
  templateUrl: './nutritionLabel.component.html',
  standalone: true,
  styleUrls: ['./nutritionLabel.component.scss']
})
export class NutritionLabelComponent implements OnInit {
    @Input() calories: number = 60;
    @Input() totalFat: string = '10g';
    @Input() cholesterol: string = '10mg';
    // Add more fields as needed
    ngOnInit(): void {
    }
}