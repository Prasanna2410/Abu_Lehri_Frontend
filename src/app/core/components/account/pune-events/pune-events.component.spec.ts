import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PuneEventsComponent } from './pune-events.component';

describe('PuneEventsComponent', () => {
  let component: PuneEventsComponent;
  let fixture: ComponentFixture<PuneEventsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PuneEventsComponent]
    });
    fixture = TestBed.createComponent(PuneEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
