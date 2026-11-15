import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

const selector = (key: string) =>
  key.startsWith('og:') ? `property='${key}'` : `name='${key}'`;

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private meta = inject(Meta);
  private title = inject(Title);
  private keys: string[] = [];

  /**
   * Set the page title and its meta tags. Keys starting with `og:` are written
   * as `property` tags, the rest as `name` tags. Pass `canonical` to point the
   * canonical link at this page.
   */
  set(title: string, tags: Record<string, string>, canonical?: string) {
    this.title.setTitle(title);

    this.keys = Object.keys(tags);
    for (const [key, content] of Object.entries(tags)) {
      this.meta.updateTag(
        key.startsWith('og:')
          ? { property: key, content }
          : { name: key, content }
      );
    }

    if (canonical) {
      document.querySelector('link[rel="canonical"]')?.remove();
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', canonical);
      document.head.appendChild(link);
    }
  }

  /**
   * Remove the meta tags the last `set` call wrote. Call when leaving the page.
   */
  clear() {
    for (const key of this.keys) this.meta.removeTag(selector(key));
    this.keys = [];
  }
}
