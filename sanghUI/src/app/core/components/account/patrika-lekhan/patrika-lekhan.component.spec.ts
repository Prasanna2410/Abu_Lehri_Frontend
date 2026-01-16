import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatrikaLekhanComponent } from './patrika-lekhan.component';

describe('PatrikaLekhanComponent', () => {
  let component: PatrikaLekhanComponent;
  let fixture: ComponentFixture<PatrikaLekhanComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PatrikaLekhanComponent]
    });
    fixture = TestBed.createComponent(PatrikaLekhanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
