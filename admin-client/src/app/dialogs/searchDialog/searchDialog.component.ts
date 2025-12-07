import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import {
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogRef,
    MatDialogTitle,
  } from '@angular/material/dialog';
import { SearchBoxComponent } from "../../sharedComponents/searchBox/searchBox.component";
  
  @Component({
    styleUrl: 'searchDialog.component.scss',
    templateUrl: 'searchDialog.component.html',
    selector: 'searchDialog',
    standalone: true,
    imports: [SearchBoxComponent, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MatButtonModule, SearchBoxComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
  })
  export class SearchDialog {
    private dialogRef = inject(MatDialogRef<SearchDialog>); // Inject MatDialogRef


    closeDialog(): void {
      this.dialogRef.close();
    }
    
    onSearchClicked(): void {
      this.closeDialog();
    }

  }
