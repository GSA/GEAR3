import { Component} from '@angular/core';
import { SharedService } from '@services/shared/shared.service';
import 'boxicons'

// Declare jQuery symbol
// declare var $: any;

@Component({
  selector: 'sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.css']
})


export class SidenavComponent {


  sideBar: HTMLElement;
  
  // Sets the intial class name for the sub menu item div as collapsed by default
  ItemList1 = "ItemListCollapse";
  ItemList2 = "ItemListCollapse";
  ItemList3 = "ItemListCollapse";
  ItemList4 = "ItemListCollapse";
  ItemList5 = "ItemListCollapse";
  ItemList6 = "ItemListCollapse";
  
  
  ngOnInit() {
    this.sideBar = document.querySelector('.side-bar') as HTMLElement; 

    console.log("sideBar: " +this.sideBar)
    
    this.sideBar.onmouseenter = this.toggleSidebar.bind(this.sideBar);
    this.sideBar.onmouseleave = this.toggleSidebar.bind(this.sideBar);
  }
  
  // Funtion responsible for toggling the sidebar
  toggleSidebar() {
    this.sideBar.classList.toggle('collapse');
    
    this.ItemList1 =  'ItemListCollapse'
    this.ItemList2 =  'ItemListCollapse'
    this.ItemList3 =  'ItemListCollapse'
    this.ItemList4 =  'ItemListCollapse'
    this.ItemList5 =  'ItemListCollapse'
    this.ItemList6 =  'ItemListCollapse'
  }

  // Function responsible for toggling the sub menu items between collapsed and expanded
  toggleSub(itemNumber : any = null) {

    if (itemNumber === 1) {
      this.ItemList1 = (this.ItemList1 === 'ItemListCollapse') ? 'ItemListExpand' : 'ItemListCollapse';
      this.ItemList2 = 'ItemListCollapse'
      this.ItemList3 = 'ItemListCollapse'
      this.ItemList4 = 'ItemListCollapse'
      this.ItemList5 = 'ItemListCollapse'
      this.ItemList6 = 'ItemListCollapse'
    } else if (itemNumber === 2){
      this.ItemList2 = (this.ItemList2 === 'ItemListCollapse') ? 'ItemListExpand' : 'ItemListCollapse';
      this.ItemList1 = 'ItemListCollapse'
      this.ItemList3 = 'ItemListCollapse'
      this.ItemList4 = 'ItemListCollapse'
      this.ItemList5 = 'ItemListCollapse'
      this.ItemList6 = 'ItemListCollapse'
    } else if (itemNumber === 3){
      this.ItemList3 = (this.ItemList3 === 'ItemListCollapse') ? 'ItemListExpand' : 'ItemListCollapse';
      this.ItemList1 = 'ItemListCollapse'
      this.ItemList2 = 'ItemListCollapse'
      this.ItemList4 = 'ItemListCollapse'
      this.ItemList5 = 'ItemListCollapse'
      this.ItemList6 = 'ItemListCollapse'
    } else if (itemNumber === 4){
      this.ItemList4 = (this.ItemList4 === 'ItemListCollapse') ? 'ItemListExpand' : 'ItemListCollapse';
      this.ItemList1 = 'ItemListCollapse'
      this.ItemList2 = 'ItemListCollapse'
      this.ItemList3 = 'ItemListCollapse'
      this.ItemList5 = 'ItemListCollapse'
      this.ItemList6 = 'ItemListCollapse'
    } else if (itemNumber === 5){
      this.ItemList5 = (this.ItemList5 === 'ItemListCollapse') ? 'ItemListExpand' : 'ItemListCollapse';
      this.ItemList1 = 'ItemListCollapse'
      this.ItemList2 = 'ItemListCollapse'
      this.ItemList3 = 'ItemListCollapse'
      this.ItemList4 = 'ItemListCollapse'
      this.ItemList6 = 'ItemListCollapse'
    } else if (itemNumber === 6){
      this.ItemList6 = (this.ItemList6 === 'ItemListCollapse') ? 'ItemListExpand' : 'ItemListCollapse';
      this.ItemList1 = 'ItemListCollapse'
      this.ItemList2 = 'ItemListCollapse'
      this.ItemList3 = 'ItemListCollapse'
      this.ItemList4 = 'ItemListCollapse'
      this.ItemList5 = 'ItemListCollapse'
    }
  }
  
  // constructor(public sharedService: SharedService) { }

  // ngOnInit(): void {
  //   if (this.sharedService.toggleSub == undefined) {
  //     this.sharedService.toggleSub = this.sharedService.toggleEmitter.subscribe(() => { this._toggleOpened(); });
  //   }

  //   $(document).ready(function () {
  //     // Logged in collapse notification
  //     $('#loggedIn').on('show.bs.toast', function () {
  //       $('#loggedInCollapse').collapse('show')
  //     });
  //     $('#loggedIn').on('hide.bs.toast', function () {
  //       $('#loggedInCollapse').collapse('hide')
  //     });

  //     // Logged out collapse notification
  //     $('#loggedOut').on('show.bs.toast', function () {
  //       $('#loggedOutCollapse').collapse('show')
  //     });
  //     $('#loggedOut').on('hide.bs.toast', function () {
  //       $('#loggedOutCollapse').collapse('hide')
  //     });
  //   });
  // }

  // _opened: boolean = false;
  // _mode: string = 'push';
  // _position: string = 'left';
  // _dock: boolean = true;
  // _dockedSize: string = '55px';
  // _closeOnClickOutside: boolean = true;
  // _closeOnClickBackdrop: boolean = false;
  // _showBackdrop: boolean = false;
  // _animate: boolean = true;
  // _trapFocus: boolean = true;
  // _autoFocus: boolean = true;
  // _keyClose: boolean = false;
  // _autoCollapseHeight: number = 500;
  // _autoCollapseWidth: number = 500;

  // _toggleOpened(): void {
  //   this._opened = !this._opened;
  // }

  // _onOpenStart(): void {
  //   console.info('Sidebar opening');
  //   $("#sidebarToggle").addClass("opposite");  // Rotate arrow inward
  // }

  // _onOpened(): void {
  //   console.info('Sidebar opened');
  // }

  // _onCloseStart(): void {
  //   console.info('Sidebar closing');
  //   $('#strategyDropdown').collapse('hide');
  //   $('#enterpriseDropdown').collapse('hide');
  //   $('#systemsDropdown').collapse('hide');
  //   $('#securityDropdown').collapse('hide');
  //   $('#technologiesDropdown').collapse('hide');
  //   $('#eaDropdown').collapse('hide');

  //   $("#sidebarToggle").removeClass("opposite");  // Rotate arrow outward
  // }

  // _onClosed(): void {
  //   console.info('Sidebar closed');
  // }

  // _onTransitionEnd(): void {
  //   console.info('Transition ended');
  // }

  // _onBackdropClicked(): void {
  //   console.info('Backdrop clicked');
  // }
  

}
const sidenavComponent = new SidenavComponent();