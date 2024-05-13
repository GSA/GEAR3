import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormatURLPipe } from 'projects/uswds-angular-library/src/public-api';
import { SafePipe } from '../../pipes/safe-html.pipe';
import { ModalComponent } from './modal.component';
import { IModal } from '../../model/modal.model';

describe('ModalComponent', () => {
  let component: ModalComponent;
  let fixture: ComponentFixture<ModalComponent>;

  const modalData1: IModal = {
    modalID: "modal-" + Math.floor(Math.random() * 10000),
    modalHeader: "Confirm Remove",
    modalText: "Are you sure you want to remove this file?",
    primaryButton: "Yes",
    secondaryButton: "No"
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ModalComponent, SafePipe, FormatURLPipe ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.modalData = modalData1;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the modal', () => {
    component.ngAfterViewInit();
    fixture.detectChanges();
    const modal = fixture.debugElement.nativeElement.querySelector(component.modalData.modalID);
    expect(modal).toBeDefined();   
  });

  it('should emit event when primary or secondary button clicked', () => {
    component.ngAfterViewInit();
    spyOn(component,"buttonClick"); 
    fixture.detectChanges();
    const modalPrimaryClick = fixture.debugElement.nativeElement.querySelector('.dx-modal__button > button'); 
    modalPrimaryClick.click();
    expect(component.buttonClick).toHaveBeenCalled();  
  });
});