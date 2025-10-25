import { CommonModule } from '@angular/common';
import {Component, Input, OnInit} from '@angular/core';

/**
 * @title Box Component
 */
@Component({
  selector: 'box',
  templateUrl: 'box.component.html',
  standalone: true,
  imports: [CommonModule],
})

export class Box implements OnInit {

    @Input() color: 'primary' | 'accent' = 'primary';
    @Input() shade: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 = 100
    @Input() width?: string;
    @Input() height?: string;
    @Input() cStyles?: string;
    @Input() customBackgroundColor?: string;
    @Input() isTransparent: boolean = false; 

    stylesObject: { [key: string]: string } = {};

    ngOnInit() {
      if (this.cStyles) {
        this.parseStyles(this.cStyles);
      }
      if (this.customBackgroundColor) {
        this.stylesObject["backgroundColor"] = this.customBackgroundColor;
      } else  
        this.stylesObject["backgroundColor"] = this.getBackgroundColor();
    }

    getBackgroundColor(): string {
      const shadeKey = `--${this.color}-${this.shade}${this.isTransparent ? '-transparent' : ''}`;
      return `var(${shadeKey})`;
    }
  
    private parseStyles(styles: string) {
      const styleEntries = styles.split(';').filter(Boolean);
      this.stylesObject = styleEntries.reduce((acc, entry) => {
        const [key, value] = entry.split(':').map(str => str.trim());
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {} as { [key: string]: string });
    }
}