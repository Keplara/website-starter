import { CommonModule, Location } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface ErrorDetails {
  status: number;
  error: string;
  message: string;
  path: string;
  timestamp: number;
}

@Component({
  selector: 'app-error-page',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.scss'],
  standalone: true,
  imports: [
    FormsModule, 
    CommonModule, 
    RouterModule, 
    MatCardModule, 
    MatIconModule, 
    MatInputModule, 
    MatFormFieldModule,
    MatButtonModule
  ]
})
export class ErrorPageComponent implements OnInit {
  private location = inject(Location);
  private http = inject(HttpClient);

  errorDetails: ErrorDetails | null = null;
  loading = true;

  ngOnInit(): void {
    this.fetchErrorDetails();
  }

  fetchErrorDetails(): void {
    this.http.get<ErrorDetails>('/error', {
      headers: { 'Accept': 'application/json' }
    }).subscribe({
      next: (details) => {
        this.errorDetails = details;
        this.loading = false;
      },
      error: () => {
        // If no error details available, show default error
        this.errorDetails = {
          status: 500,
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
          path: 'unknown',
          timestamp: Date.now()
        };
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.location.back();
  }
}