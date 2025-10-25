import { CommonModule } from '@angular/common';
import {Component, Input, OnInit} from '@angular/core';

/**
 * @title Overlay Component
 */
@Component({
  selector: 'overlay',
  templateUrl: 'overlay.component.html',
  standalone: true,
  imports: [CommonModule],
})

export class OverlayComponent implements OnInit {

    @Input() darkness: "light" | "medium" | "dark" | null | undefined;
    @Input() width: string = "100%";
    @Input() height: string = "100%";
    @Input() imageUrl?: string | undefined;
    @Input() backgroundImagePosition?: 'bottom center' | 'top center' | 'bottom right' | 'top right' |' top left' |  'bottom left' | 'right' | 'center' | 'left' | 'top' | 'bottom' = 'center';

    backgroundColor: string = '';
    backgroundImage: string | null = null

    ngOnInit() {
      if (this.imageUrl) {
        this.backgroundImage = `url(${this.imageUrl})`
      } else {
        switch (this.darkness) {
          case 'light':
            this.backgroundColor = 'rgba(0, 0, 0, 0.3)';
            break;
          case 'medium':
            this.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            break;
          case 'dark':
            this.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            break;
          default:
            this.backgroundColor = 'transparent';
        }
      }
    }
}