import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'HighlightUnitPipe',
  standalone: true,
})
export class HighlightUnitPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string, truncateTo?: number): SafeHtml {

    let text = value;
  
    // Truncate the text
    if (truncateTo && value.length > truncateTo) {
      text = value.slice(0, truncateTo) + '...';
    }
  
    // Expression to match unit codes
    const unitCodeRegex = /\b([a-zA-Z]{3}\d{4})\b/g;
    
    // Replace unit codes with links directed to their respective unit pages
    const replacedText = text.replace(unitCodeRegex, (match) => {
      const url = `/unit/${match.toLowerCase()}`;
      return `<a href="${url}" style="color:rgb(151, 46, 231) !important; text-decoration: underline !important;">${match}</a>`;
    });
  
    return this.sanitizer.bypassSecurityTrustHtml(replacedText);
  }
}
