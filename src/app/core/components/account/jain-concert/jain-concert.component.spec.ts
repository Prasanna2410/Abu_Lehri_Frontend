import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JainConcertComponent } from './jain-concert.component';

describe('JainConcertComponent', () => {
  let component: JainConcertComponent;
  let fixture: ComponentFixture<JainConcertComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [JainConcertComponent]
    });
    fixture = TestBed.createComponent(JainConcertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
