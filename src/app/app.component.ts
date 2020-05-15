import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'gear3';

  _opened: boolean = false;
  _mode: string = 'push';
  _position: string = 'left';
  _dock: boolean = true;
  _dockedSize: string = '50px';
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
