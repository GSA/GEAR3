import { Column } from "@common/table-classes";
import { formatDescription } from "./column-formatters";

export const RecordsColumns: Column[] = [
    {
        field: 'GSA_Number',
        header: 'GSA Number',
        isSortable: true
      }, {
        field: 'Record_Item_header',
        header: 'Record header',
        isSortable: true
      }, {
        field: 'Description',
        header: 'Description',
        isSortable: false,
        showColumn: false,
        formatter: formatDescription
      }, {
        field: 'Record_Status',
        header: 'Status',
        showColumn: false,
        isSortable: true
      }, {
        field: 'RG',
        header: 'Record Group',
        showColumn: false,
        isSortable: true
      }, {
        field: 'Retention_Instructions',
        header: 'Retention Instructions',
        isSortable: false,
        formatter: formatDescription
      }, {
        field: 'Legal_Disposition_Authority',
        header: 'Disposition Authority (DA)',
        isSortable: true
      }, {
        field: 'Type_Disposition',
        header: 'Disposition Type',
        showColumn: false,
        isSortable: true
      }, {
        field: 'Date_DA_Approved',
        header: 'DA Approval Date',
        isSortable: true
      }, {
        field: 'Disposition_Notes',
        header: 'Disposition Notes',
        isSortable: false,
        showColumn: false,
        formatter: formatDescription
      }, {
        field: 'FP_Category',
        header: 'FP Category',
        showColumn: false,
        isSortable: true
      }, {
        field: 'PII',
        header: 'PII',
        isSortable: true
      }, {
        field: 'CUI',
        header: 'CUI',
        isSortable: true
      }, {
        field: 'FY_Retention_Years',
        header: 'Retention Years',
        showColumn: false,
        isSortable: true
      }
];