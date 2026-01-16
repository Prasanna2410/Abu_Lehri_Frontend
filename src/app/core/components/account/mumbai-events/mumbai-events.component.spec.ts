import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MumbaiEventsComponent } from './mumbai-events.component';

describe('MumbaiEventsComponent', () => {
  let component: MumbaiEventsComponent;
  let fixture: ComponentFixture<MumbaiEventsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MumbaiEventsComponent]
    });
    fixture = TestBed.createComponent(MumbaiEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
