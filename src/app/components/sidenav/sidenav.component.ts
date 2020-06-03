import { Component, OnInit } from '@angular/core';
import { SharedService } from '../../services/shared/shared.service';

// Declare jQuery symbol
declare var $: any;

@Component({
  selector: 'sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.css']
})
export class SidenavComponent implements OnInit {

  constructor(private sharedService: SharedService) { }

  ngOnInit(): void {
    if (this.sharedService.subsVar == undefined) {
      this.sharedService.subsVar = this.sharedService.
      toggleEmitter.subscribe(() => {
        this._toggleOpened();
      });
    }
  }

  _opened: boolean = false;
  _mode: string = 'push';
  _position: string = 'left';
  _dock: boolean = true;
  _dockedSize: string = '65px';
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
  }

  _onOpened(): void {
    console.info('Sidebar opened');
  }

  _onCloseStart(): void {
    console.info('Sidebar closing');
    $('#strategyDropdown').collapse('hide');
    $('#businessDropdown').collapse('hide');
    $('#businessAppDropdown').collapse('hide');
  }

  _onClosed(): void {
    console.info('Sidebar closed');
  }

  _onTransitionEnd(): void {
    console.info('Transition ended');
  }

  _onBackdropClicked(): void {
    console.info('Backdrop clicked');
  }

}
