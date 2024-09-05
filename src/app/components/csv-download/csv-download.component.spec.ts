import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CsvDownloadComponent } from './csv-download.component';

describe('CsvDownloadComponent', () => {
  let component: CsvDownloadComponent;
  let fixture: ComponentFixture<CsvDownloadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CsvDownloadComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CsvDownloadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
