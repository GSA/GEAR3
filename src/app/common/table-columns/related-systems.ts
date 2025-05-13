import { Column } from "@common/table-classes";
import { pocStringNameFormatter } from "./column-formatters";

export const RelatedSystemsCols: Column[] = [
    {
        field: 'DisplayName',
        header: 'Alias/Acronym',
        isSortable: true,
    },
    {
        field: 'Name',
        header: 'System Name',
        isSortable: true,
    },
    {
        field: 'Description',
        header: 'Description',
        isSortable: true,
        showColumn: false,
        class: 'text-truncate',
    },
    {
        field: 'SystemLevel',
        header: 'System Level',
        isSortable: true,
    },
    {
        field: 'Status',
        header: 'Status',
        isSortable: true,
    },
    {
        field: 'BusOrg',
        header: 'Business Org',
        isSortable: true,
    },
    {
        field: 'RespOrg',
        header: 'Responsible Org',
        isSortable: true,
    },
    {
        field: 'ParentName',
        header: 'Parent System',
        isSortable: true,
        showColumn: false,
    },
    {
        field: 'CSP',
        header: 'Cloud Server Provider',
        isSortable: true,
        showColumn: false,
    },
    {
        field: 'CloudYN',
        header: 'Cloud Hosted?',
        isSortable: true,
        showColumn: false,
    },
    {
        field: 'AO',
        header: 'Authorizing Official',
        isSortable: true,
        showColumn: false,
        formatter: pocStringNameFormatter,
    },
    {
        field: 'SO',
        header: 'System Owner',
        isSortable: true,
        showColumn: false,
        formatter: pocStringNameFormatter,
    },
    {
        field: 'BusPOC',
        header: 'Business POC',
        isSortable: true,
        showColumn: false,
        formatter: pocStringNameFormatter,
    },
    {
        field: 'TechPOC',
        header: 'Technical POC',
        isSortable: true,
        showColumn: false,
        formatter: pocStringNameFormatter,
    },
    {
        field: 'DataSteward',
        header: 'Data Steward',
        isSortable: true,
        showColumn: false,
        formatter: pocStringNameFormatter,
    },
];