import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RateSheetComponent } from './rate-sheet.component';

describe('RateSheetComponent', () => {
  let component: RateSheetComponent;
  let fixture: ComponentFixture<RateSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RateSheetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RateSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
