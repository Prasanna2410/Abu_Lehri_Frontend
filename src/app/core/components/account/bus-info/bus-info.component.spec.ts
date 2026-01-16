import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusInfoComponent } from './bus-info.component';

describe('BusInfoComponent', () => {
  let component: BusInfoComponent;
  let fixture: ComponentFixture<BusInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BusInfoComponent]
    });
    fixture = TestBed.createComponent(BusInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
