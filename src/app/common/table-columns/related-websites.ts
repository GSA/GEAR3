import { Column } from "@common/table-classes";

export const RelatedWebsitesColumns: Column[] = [
  {
    field: 'website_id',
    header: 'Website Id',
    isSortable: true,
    class: 'w-11'
  },
  {
    field: 'domain',
    header: 'Domain',
    isSortable: true
  },
  {
    field: 'site_owner_email',
    header: 'Website Manager Email',
    isSortable: true
  },
  {
    field: 'office',
    header: 'Office',
    isSortable: true
  },
  {
    field: 'sub_office',
    header: 'Sub-Office',
    isSortable: true
  },
  {
    field: 'production_status',
    header: 'Production Status',
    isSortable: true
  },
];