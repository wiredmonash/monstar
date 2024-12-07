import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'decimal',
  standalone: true
})
export class DecimalPipe implements PipeTransform {
  transform (value: number) {
    return value.toFixed(1);
  }
}
