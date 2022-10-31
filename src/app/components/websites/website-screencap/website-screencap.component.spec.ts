import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebsiteScreencapComponent } from './website-screencap.component';

describe('WebsiteScreencapComponent', () => {
  let component: WebsiteScreencapComponent;
  let fixture: ComponentFixture<WebsiteScreencapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WebsiteScreencapComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WebsiteScreencapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
