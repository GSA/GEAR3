import { Column } from "@common/table-classes";
import { formatDescription } from "./column-formatters";

export const RecordsColumns: Column[] = [
    {
        field: 'GSA_Number',
        header: 'GSA Number',
        isSortable: true
      }, {
        field: 'Record_Item_Title',
        header: 'Record Title',
        isSortable: true
      }, {
        field: 'Description',
        header: 'Description',
        isSortable: false,
        formatter: formatDescription
      }, {
        field: 'FY_Retention_Years',
        header: 'Retention Years',
        isSortable: true
      }, {
        field: 'Retention_Instructions',
        header: 'Retention Instructions',
        isSortable: false,
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
        field: 'Legal_Disposition_Authority',
        header: 'Disposition Authority (DA)',
        showColumn: false,
        isSortable: true
      }, {
        field: 'Type_Disposition',
        header: 'Disposition Type',
        showColumn: false,
        isSortable: true
      }, {
        field: 'Date_DA_Approved',
        header: 'DA Approval Date',
        showColumn: false,
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
        showColumn: false,
        isSortable: true
      }, {
        field: 'CUI',
        header: 'CUI',
        showColumn: false,
        isSortable: true
      }
];