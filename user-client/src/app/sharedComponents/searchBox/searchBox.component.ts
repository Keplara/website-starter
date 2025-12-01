import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { CoreService } from '../../services/core.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Product } from '../../interfaces/core.interface';


/** @title Form field with prefix & suffix */
@Component({
  selector: 'search-box',
  templateUrl: 'searchBox.component.html',
  styleUrl: './searchBox.component.scss',
  standalone: true,
  imports: [MatFormFieldModule, CommonModule, FormsModule, MatInputModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class SearchBoxComponent implements OnInit {
  @Input() hide?: boolean;
  @Input() cStyles?: string;
  @Output() searchClicked = new EventEmitter<void>(); // Emit event
  
  searchQuery: string = "";
  results: string = '';
  error: string | null = null;
  hasError: boolean = false;
  stylesObject: { [key: string]: string } = {};

  constructor(private router: Router, private coreService: CoreService){}

  ngOnInit() {
    if (this.cStyles) {
      this.parseStyles(this.cStyles);
    }

    this.coreService.getSearchQuery().subscribe(searchQuery=>{
      this.searchQuery = searchQuery
    });

  }

  private parseStyles(styles: string) {
    const styleEntries = styles.split(';').filter(Boolean);
    this.stylesObject = styleEntries.reduce((acc, entry) => {
      const [key, value] = entry.split(':').map(str => str.trim());
      
      // Convert kebab-case to camelCase
      const camelCaseKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  
      if (camelCaseKey && value) {
        acc[camelCaseKey] = value;
      }
      return acc;
    }, {} as { [key: string]: string });
  }

  onSearch(): void {
    this.searchClicked.emit();
    this.searchQuery = this.searchQuery.trim();

    if (this.searchQuery.length > 0) {
      this.coreService.search(this.searchQuery);
    }
  }

}