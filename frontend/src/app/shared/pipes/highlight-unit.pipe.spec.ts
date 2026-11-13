import { SecurityContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { HighlightUnitPipe } from './highlight-unit.pipe';

describe('HighlightUnitPipe', () => {
  let sanitizer: DomSanitizer;
  let pipe: HighlightUnitPipe;

  beforeEach(() => {
    sanitizer = TestBed.inject(DomSanitizer);
    pipe = new HighlightUnitPipe(sanitizer);
  });

  /** Renders the pipe output the way review-card's [innerHTML] binding does. */
  function render(text: string): HTMLElement {
    const el = document.createElement('p');
    el.innerHTML =
      sanitizer.sanitize(SecurityContext.HTML, pipe.transform(text)) ?? '';
    return el;
  }

  it('links unit codes to their unit pages', () => {
    const el = render('Take fit1045 before FIT2004.');
    const links = el.querySelectorAll('a');

    expect(links.length).toBe(2);
    expect(links[0].getAttribute('href')).toBe('/unit/fit1045');
    expect(links[0].textContent).toBe('FIT1045');
    expect(links[1].getAttribute('href')).toBe('/unit/fit2004');
    expect(el.textContent).toBe('Take FIT1045 before FIT2004.');
  });

  it('shows HTML in a review with a unit code as plain text', () => {
    const review = 'FIT1045 <img src=x onerror="window.xssFired = true">';
    const el = render(review);

    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('a')?.textContent).toBe('FIT1045');
    expect(el.textContent).toBe(review);
  });
});
