import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomInfoComponent } from './room-info.component';

describe('RoomInfoComponent', () => {
  let component: RoomInfoComponent;
  let fixture: ComponentFixture<RoomInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RoomInfoComponent]
    });
    fixture = TestBed.createComponent(RoomInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
