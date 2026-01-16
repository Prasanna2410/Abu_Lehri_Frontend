import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TentInfoComponent } from './tent-info.component';

describe('TentInfoComponent', () => {
  let component: TentInfoComponent;
  let fixture: ComponentFixture<TentInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TentInfoComponent]
    });
    fixture = TestBed.createComponent(TentInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
