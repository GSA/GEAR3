import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DataDictionaryPrimeNGComponent } from './data-dictionary-primeng.component';

describe('DataDictionaryPrimeNGComponent', () => {
  let component: DataDictionaryPrimeNGComponent;
  let fixture: ComponentFixture<DataDictionaryPrimeNGComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DataDictionaryPrimeNGComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DataDictionaryPrimeNGComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
