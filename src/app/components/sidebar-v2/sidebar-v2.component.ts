import { Component } from '@angular/core';
import { SidebarButtonChild } from '@common/sidebar-classes';

@Component({
    selector: 'app-sidebar-v2',
    templateUrl: './sidebar-v2.component.html',
    styleUrls: ['./sidebar-v2.component.scss'],
    standalone: false
})
export class SidebarV2Component {

  public isSidebarExpanded: boolean = false;
  public activeMenu: string | null = null;

  public itStrategyChildren: SidebarButtonChild[] = [
    { text: 'IT Strategic Framework', route: '/strategic_framework' },
    { text: 'IT Investments', route: '/investments' }
  ];
  public gsaEnterpriseChildren: SidebarButtonChild[] = [
    { text: 'Business Capability Model', route: '/capabilities_model' },
    { text: 'Business Capability List', route: '/capabilities' },
    { text: 'Organization Chart', route: '/org_chart' },
    { text: 'Organization List', route: '/organizations' },
    { text: 'Website Service Category List', route: '/website_service_category' }
  ];
  public businessSystemsChildren: SidebarButtonChild[] = [
    { text: 'Business Systems & Subsystems', route: '/systems' },
    { text: 'TIME Report', route: '/systems_TIME' },
    { text: 'Records Management', route: '/records_mgmt' },
    { text: 'GSA Websites', route: '/websites' }
  ];
  public securityChildren: SidebarButtonChild[] = [
    { text: 'FISMA Systems Inventory', route: '/FISMA' },
    { text: 'FISMA System POCs', route: '/FISMA_POC' }
  ];
  public technologiesChildren: SidebarButtonChild[] = [
    { text: 'IT Standards List', route: '/it_standards' },
    { text: 'IT Standards Approval Process', href: 'https://sites.google.com/a/gsa.gov/it_standards/software-approvals#h.vioogtbleinq', icon: 'fas fa-external-link-alt' }
  ];
  public enterpriseArchitectureChildren: SidebarButtonChild[] = [
    { text: 'GEAR Model Diagram', route: '/gear_model' }
  ];
  public additionalInfoChildren: SidebarButtonChild[] = [
    { text: 'Access Forms', route: '/forms' },
    { text: 'Glossary', route: '/glossary' },
    { text: 'Data Dictionary', route: '/data_dictionary' },
    { text: 'API Documentation', href: 'https://gsa.github.io/GEAR-Documentation/api-docs/', icon: 'fas fa-external-link-alt' },
    { text: 'Overview', route: '/about/overview' },
    { text: 'Data', route: '/about/data' },
    { text: 'Systems Rationalization', route: '/about/sysRat' }
  ];
  
  constructor() {
  }

  public toggleSidebar(): void {
    this.isSidebarExpanded = !this.isSidebarExpanded;
  }

  public onMenuToggle(menuKey: string): void {
    this.activeMenu = this.activeMenu === menuKey ? null : menuKey;
  }

  public onKeyUp(e: KeyboardEvent, menuKey: string): void {
    if(e.key === ' ' || e.key === 'Enter') {
      this.onMenuToggle(menuKey);
    }
  }

  public onRouteChange(): void {
    this.isSidebarExpanded = false;
  }
  
}

