import { Column } from "@common/table-classes";

export const WebsitesColumns: Column[] = [
    {
        field: 'domain',
        header: 'Domain',
        isSortable: true,
      },
      {
        field: 'office',
        header: 'Office',
        isSortable: true,
      },
      {
        field: 'site_owner_email',
        header: 'Website Manager',
        isSortable: true,
      },
      {
        field: 'contact_email',
        header: 'Contact Email',
        isSortable: true,
      },
      {
        field: 'production_status',
        header: 'Status',
        isSortable: true,
      },
      {
        field: 'redirects_to',
        header: 'Redirect URL',
        isSortable: true,
      },
      {
        field: 'required_by_law_or_policy',
        header: 'Required by Law/Policy?',
        isSortable: true,
      },
      {
        field: 'has_dap',
        header: 'DAP Enabled',
        isSortable: true,
      },
      {
        field: 'mobile_friendly',
        header: 'Mobile Friendly?',
        isSortable: true,
      },
      {
        field: 'has_search',
        header: 'Has Search?',
        isSortable: true,
      },
      {
        field: 'repository_url',
        header: 'Repository URL',
        isSortable: true,
      },
      {
        field: 'hosting_platform',
        header: 'Hosting Platform',
        isSortable: true,
      },
      {
        field: 'cms_platform',
        header: 'Content Management Platform',
        isSortable: true,
      },
      {
        field: 'https',
        header: 'HTTPS Enabled',
        isSortable: true,
      },
      {
        field: 'sub_office',
        header: 'Sub-office',
        isSortable: false,
        showColumn: false,
        class: 'text-truncate',
      },
      {
        field: 'type_of_site',
        header: 'Type of Site',
        isSortable: true,
        showColumn: true,
        class: 'text-truncate',
      }
];