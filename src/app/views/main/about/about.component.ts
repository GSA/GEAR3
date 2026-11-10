import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.css'],
    standalone: false
})
export class AboutComponent implements OnInit {
  activeTab: string = 'overview';

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const tab = params['tab'];
      if (tab) {
        this.activeTab = tab;
      } else {
        this.activeTab = 'overview';
      }
    });
  }

  onTabClick(tabName: string, event: Event): void {
    event.preventDefault();
    
    this.activeTab = tabName;
    
    this.router.navigate(['/about', tabName]);
  }

  isActiveTab(tabName: string): boolean {
    return this.activeTab === tabName;
  }

}