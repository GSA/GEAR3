import { Pipe, PipeTransform } from '@angular/core';
/*
 * Takes a 'T' or 'F' value and converts it to 'Yes' or 'No'.
 * Usage:
 *   value | yesno
 * Example:
 *   {{ 'T' | yesno }}
 *   formats to: Yes
*/
@Pipe({
  standalone: false,
  name: 'yesno'
})
export class YesNoPipe implements PipeTransform {
  transform(value: string): string {
    return value === 'T'? 'Yes' : 'No';
  }
}
