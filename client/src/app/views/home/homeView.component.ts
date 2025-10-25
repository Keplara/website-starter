import {Component, inject} from '@angular/core';
import { OverlayComponent } from '../../sharedComponents/overlay/overlay.component';
import { Box } from '../../sharedComponents/box/box.component';
import { CommonModule } from '@angular/common';
import { SearchBoxComponent } from '../../sharedComponents/searchBox/searchBox.component';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SearchDialog } from '../../dialogs/searchDialog/searchDialog.component';

/**
 * @title Home View
 */
@Component({
  selector: 'app-homeView',
  templateUrl: 'homeView.component.html',
  styleUrl: 'homeView.component.scss',
  standalone: true,
  imports: [OverlayComponent,RouterLink,Box,SearchBoxComponent, CommonModule,MatButtonModule,MatFormFieldModule,MatIconModule,MatInputModule],
})

export class HomeViewComponent {
  readonly dialog = inject(MatDialog);



  openDialog(): void {
    this.dialog.open(SearchDialog);
  }
  
}