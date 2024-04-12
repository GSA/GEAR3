import { Component, OnInit } from '@angular/core';
import { SharedService } from '@services/shared/shared.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.css']
})
export class SidenavComponent implements OnInit {

  constructor(public sharedService: SharedService) { }

  ngOnInit(): void {
    if (this.sharedService.toggleSub == undefined) {
      this.sharedService.toggleSub = this.sharedService.toggleEmitter.subscribe(() => { this._toggleOpened(); });
    }

    $(document).ready(function () {
      // Logged in collapse notification
      $('#loggedIn').on('show.bs.toast', function () {
        $('#loggedInCollapse').collapse('show')
      });
      $('#loggedIn').on('hide.bs.toast', function () {
        $('#loggedInCollapse').collapse('hide')
      });

      // Logged out collapse notification
      $('#loggedOut').on('show.bs.toast', function () {
        $('#loggedOutCollapse').collapse('show')
      });
      $('#loggedOut').on('hide.bs.toast', function () {
        $('#loggedOutCollapse').collapse('hide')
      });
    });
  }

  _opened: boolean = false;
  _mode: string = 'push';
  _position: string = 'left';
  _dock: boolean = true;
  _dockedSize: string = '55px';
  _closeOnClickOutside: boolean = true;
  _closeOnClickBackdrop: boolean = false;
  _showBackdrop: boolean = false;
  _animate: boolean = true;
  _trapFocus: boolean = true;
  _autoFocus: boolean = true;
  _keyClose: boolean = false;
  _autoCollapseHeight: number = 500;
  _autoCollapseWidth: number = 500;

  _toggleOpened(): void {
    this._opened = !this._opened;
  }

  _onOpenStart(): void {
    console.info('Sidebar opening');
    $("#sidebarToggle").addClass("opposite");  // Rotate arrow inward
  }

  _onOpened(): void {
    console.info('Sidebar opened');
  }

  _onCloseStart(): void {
    console.info('Sidebar closing');
    $('#strategyDropdown').collapse('hide');
    $('#enterpriseDropdown').collapse('hide');
    $('#systemsDropdown').collapse('hide');
    $('#securityDropdown').collapse('hide');
    $('#technologiesDropdown').collapse('hide');
    $('#eaDropdown').collapse('hide');
    $('#addinfoDropdown').collapse('hide');

    $("#sidebarToggle").removeClass("opposite");  // Rotate arrow outward
  }

  _onClosed(): void {
    console.info('Sidebar closed');
    $(window).trigger("resize");
  }

  _onTransitionEnd(): void {
    console.info('Transition ended');
    $(window).trigger("resize");
  }

  _onBackdropClicked(): void {
    console.info('Backdrop clicked');
  }

}
