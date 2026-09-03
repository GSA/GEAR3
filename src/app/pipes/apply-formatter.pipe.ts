import { Pipe, PipeTransform } from '@angular/core';
/*
 * Applies a table column's formatter function to a cell value.
 * Pure by default, so Angular only re-invokes transform() when
 * value or formatter change reference, unlike a plain method call
 * in a template which re-runs on every change-detection cycle.
 * Usage:
 *   value | applyFormatter:formatter
 */
@Pipe({
  standalone: false,
  name: 'applyFormatter'
})
export class ApplyFormatterPipe implements PipeTransform {
  transform(value: any, formatter: Function): any {
    return formatter ? formatter(value) : value;
  }
}
