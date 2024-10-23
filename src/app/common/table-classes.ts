export type TwoDimArray<T> = T[][];

export interface Column {
  header: string,
  field: string,
  isSortable?: boolean,
  showColumn?: boolean,
  class?: string,
  formatter?: Function,
  titleTooltip?: string
}

export interface ExportColumn {
  title: string;
  dataKey: string;
}

export interface ButtonFilter {
  field: string,
  filterBtnText: string,
  filterOn: string
}