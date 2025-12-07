import { Component } from '@angular/core';
import { ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [BaseChartDirective]
})
  
export class DashboardComponent {

  pieChartData: ChartData<'pie', number[], string> = {
    labels: ['Users', 'Products', 'IAM', 'Cases'],
    datasets: [
      {
        data: [120, 300, 50, 80],
        backgroundColor: ['#1976d2', '#388e3c', '#fbc02d', '#d32f2f']
      }
    ]
  };
  pieChartType: any = 'pie';

  barChartData: ChartData<'bar', number[], string> = {
    labels: ['Users', 'Products', 'IAM', 'Cases'],
    datasets: [
      {
        data: [120, 300, 50, 80],
        label: 'Count',
        backgroundColor: ['#1976d2', '#388e3c', '#fbc02d', '#d32f2f']
      }
    ]
  };
  barChartType: any = 'bar';

}
