import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

// Matches any current Monash unit code, case‑insensitive
const UNIT_CODE_REGEX = /\b[a-zA-Z]{3}\d{4}\b/gi;

/**
 * * Highlight Unit Pipe
 * 
 * A pipe that highlights unit codes in a string and converts them into links.
 * The links direct to the unit's page (open in new tab).
 * 
 * @param value The string to be transformed.
 * @param truncateTo Optional parameter to truncate the string to a certain length.
 * @returns The transformed string with unit codes highlighted and converted to links.
 */
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
    
    // Fast fail if the text doesn't contain any unit codes
    if (!UNIT_CODE_REGEX.test(text)) {
      UNIT_CODE_REGEX.lastIndex = 0; 
      return text;
    }
    UNIT_CODE_REGEX.lastIndex = 0; 
    
    // Replace unit codes with links directed to their respective unit pages
    const replacedText = text.replace(UNIT_CODE_REGEX, (match) => {
      const url = `/unit/${match.toLowerCase()}`;
      return `<a 
        href="${url}" 
        target="_blank"
        style="
          font-weight: 600 !important;
          color:rgb(147, 26, 147) !important; 
          text-decoration: none !important;
          cursor: pointer !important;
        "
      >${match.toUpperCase()}</a>`;
    });
  
    return this.sanitizer.bypassSecurityTrustHtml(replacedText);
  }
}
