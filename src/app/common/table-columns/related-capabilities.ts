import { Column } from "@common/table-classes";
import { formatDescriptionLite } from "./column-formatters";

export const RelatedCapabilitiesColumns: Column[] = [
    {
        field: 'ReferenceNum',
        header: 'Ref Id',
        isSortable: true,
        class: 'w-15'
      }, {
        field: 'Name',
        header: 'Capability Name',
        isSortable: true
      }, {
        field: 'Description',
        header: 'Description',
        isSortable: true,
        showColumn: false,
        formatter: formatDescriptionLite,
      }, {
        field: 'Level',
        header: 'Level',
        isSortable: true
      }, {
        field: 'Parent',
        header: 'Parent',
        isSortable: true
      }
];