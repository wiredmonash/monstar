import { ViewportScroller } from '@angular/common';
import { Directive, ElementRef, OnInit, OnDestroy, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appFullPageLayout]',
  standalone: true
})
export class FullPageLayoutDirective implements OnInit, OnDestroy {
  @Input() disableScrolling: boolean = true;
  private originalOverflow: string = '';

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) { }

  ngOnInit(): void {
    // Store original body overflow setting
    this.originalOverflow = document.body.style.overflow;

    // Small delay then disable scrolling if requested
    setTimeout(() => {
      if (this.disableScrolling) { 
        document.body.style.overflow = 'hidden';
      }
    }, 1500);

    // Apply styles to make this element fill the available space
    this.renderer.addClass(this.el.nativeElement, 'full-page-container');
  }

  ngOnDestroy(): void {
    // Restore original body overflow setting
    document.body.style.overflow = this.originalOverflow;
  }
}
