import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, Input, OnInit, Renderer2, ViewChild } from '@angular/core';
import { debounceTime, Subject, Subscription } from 'rxjs';

/**
 * @title TextBox Container
 */
@Component({
    selector: 'textBox',
    templateUrl: 'textBox.component.html',
    standalone: true,
    imports: [CommonModule],
})

export class TextBox implements OnInit, AfterViewInit {
    @Input() color: 'primary' | 'accent' = 'primary';
    @Input() font: 'primary' | 'accent' = 'primary';
    @Input() initialRemSize: number = 1;
    @Input() height?: string;
    @Input() cStyles?: string;
    @Input() autoSize: boolean = true;
    @Input() horizontalAlignment: 'left' | 'center' | 'right' = 'left';
    @Input() verticalAlignment: 'top' | 'center' | 'bottom' = 'top';
    @Input() boxPadding: number = 2;
    @Input() indent: number = 0;
    @Input() maxRem: number = 3;
    stylesObject: { [key: string]: string } = {}; // Object to store parsed styles

    @ViewChild('textElement', { static: true }) textElement!: ElementRef;

    private resizeSubject = new Subject<void | Event>();
    private resizeSubscription: Subscription | undefined;

    constructor(
        private renderer: Renderer2
    ) { }

    ngOnInit() {
        this.setupResizeListener();
        this.parseStyles()
    }

    ngAfterViewInit() {
        this.resizeSubject.next();
    }

    @HostListener('window:resize', ['$event'])
    onResize(event: Event): void {
        this.resizeSubject.next(event);
    }

    private setupResizeListener() {
        this.resizeSubscription = this.resizeSubject.pipe(
            debounceTime(500)
        ).subscribe(() => this.adjustFontSize());
    }

    ngOnDestroy() {
        if (this.resizeSubscription) {
            this.resizeSubscription.unsubscribe();
        }
    }


    getColor(): string {
        if (!this.color) {
            throw new Error('Color are required fields.');
        }

        const shadeKey = `--primary-font-color-${this.color}`;
        return `var(${shadeKey})`;
    }

    private parseStyles(): void {
        if (!this.cStyles) return;

        const styleEntries = this.cStyles.split(';').filter(Boolean);
        this.stylesObject = styleEntries.reduce((acc, entry) => {
            const [key, value] = entry.split(':').map(str => str.trim());
            if (key && value) {
                acc[key] = value;
            }
            return acc;
        }, {} as { [key: string]: string });
    }

    private adjustFontSize(): void {
        if (typeof window !== 'undefined') {
            const screenWidth = window.innerWidth;
            const calculatedSize = this.initialRemSize + (screenWidth * 0.00125);
            if (calculatedSize > this.maxRem) {
                this.renderer.setStyle(this.textElement.nativeElement, 'font-size', `${this.maxRem}rem`);
            } else {
                this.renderer.setStyle(this.textElement.nativeElement, 'font-size', `calc(${this.initialRemSize}rem + 1.25vw)`);
            }
        }
    }
}