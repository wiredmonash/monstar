import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'integer',
  standalone: true
})
export class IntegerPipe implements PipeTransform {
  transform(value: number): number {
    return Math.floor(value);
  }

}
