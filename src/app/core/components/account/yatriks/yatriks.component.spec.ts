import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YatriksComponent } from './yatriks.component';

describe('YatriksComponent', () => {
  let component: YatriksComponent;
  let fixture: ComponentFixture<YatriksComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [YatriksComponent]
    });
    fixture = TestBed.createComponent(YatriksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
