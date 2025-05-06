import { Column } from "@common/table-classes";
import { dateFormatter, emailFormatter, linksFormatter } from "./column-formatters";

export const SystemTimeColumns: Column[] = [
    {
        field: 'FY',
        header: 'FY',
        isSortable: true
    }, {
        field: 'TIME Designation',
        header: 'TIME Designation',
        isSortable: true
    }, {
        field: 'Business Score',
        header: 'Business Score',
        showColumn: false,
        isSortable: true
    }, {
        field: 'Technical Score',
        header: 'Technical Score',
        showColumn: false,
        isSortable: true
    }, {
        field: 'O&M Cost',
        header: 'O&M Cost',
        showColumn: false,
        isSortable: true
    }, {
        field: 'DM&E Cost',
        header: 'DM&E Cost',
        showColumn: false,
        isSortable: true
    }, {
        field: 'Software/Hardware License Costs',
        header: 'License Costs',
        showColumn: false,
        isSortable: true
    }, {
        field: 'Questionnaire Last Updated',
        header: 'Questionnaire Last Updated',
        isSortable: true,
        showColumn: false,
        formatter: dateFormatter
    }, {
        field: 'POC Last Updated',
        header: 'POC of Last Updated',
        isSortable: true,
        showColumn: false,
        formatter: emailFormatter
    }, {
        field: 'File Link',
        header: 'File Link',
        showColumn: false,
        isSortable: true,
        formatter: linksFormatter
    }
];