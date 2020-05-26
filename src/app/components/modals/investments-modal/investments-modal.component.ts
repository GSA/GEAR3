import { Component, OnInit } from '@angular/core';

import { ModalsService } from '../../../services/modals/modals.service';

@Component({
  selector: 'investments-modal',
  templateUrl: './investments-modal.component.html',
  styleUrls: ['./investments-modal.component.css']
})
export class InvestmentsModalComponent implements OnInit {

  investment: any;

  constructor(private modalService: ModalsService) { }

  ngOnInit(): void {
    this.modalService.currentInvest.subscribe(investment => this.investment = investment);
  }

}
