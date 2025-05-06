import { Column } from "@common/table-classes";

export const RelatedCapabilitiesColumns: Column[] = [
    {
        field: 'ReferenceNum',
        header: 'Ref Id',
        isSortable: true
      }, {
        field: 'Name',
        header: 'Capability Name',
        isSortable: true
      }, {
        field: 'Description',
        header: 'Description',
        isSortable: true,
        showColumn: false,
        class: 'text-truncate'
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