import { Injectable, signal } from '@angular/core';

export type ViewportType = 'desktop' | 'laptop' | 'tablet' | 'mobile';

const viewportFor = (width: number): ViewportType => {
  if (width <= 400) return 'mobile';
  if (width <= 768) return 'tablet';
  if (width <= 1024) return 'laptop';
  return 'desktop';
};

@Injectable({
  providedIn: 'root',
})
export class ViewportService {
  /** The current viewport type, kept up to date as the window resizes. */
  readonly type = signal(viewportFor(window.innerWidth));

  constructor() {
    window.addEventListener('resize', () =>
      this.type.set(viewportFor(window.innerWidth))
    );
  }
}
