import { Column } from "@common/table-classes";

export const RelatedTechnologiesColumns: Column[] = [
    {
        field: 'Name',
        header: 'Technology',
        isSortable: true
      }, {
        field: 'Description',
        header: 'Description',
        isSortable: true,
        showColumn: false,
        class: 'text-truncate'
      }, {
        field: 'Category',
        header: 'Software Category',
        isSortable: true,
      }, {
        field: 'AttestationRequired',
        header: 'Attestation Required',
        showColumn: false,
        isSortable: true,
      }, {
        field: 'AttestationLink',
        header: 'Attestation Link',
        showColumn: false,
        isSortable: true,
      }, {
        field: 'Fedramp',
        header: 'Fedramp',
        showColumn: false,
        isSortable: true,
      }, {
        field: 'OpenSource',
        header: 'Open Source',
        showColumn: false,
        isSortable: true,
      }, {
        field: 'RITM',
        header: 'Requested Item (RITM)',
        showColumn: false,
        isSortable: true,
      }
];