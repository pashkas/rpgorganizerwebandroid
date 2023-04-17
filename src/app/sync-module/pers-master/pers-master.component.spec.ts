import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PersMasterComponent } from './pers-master.component';

describe('PersMasterComponent', () => {
  let component: PersMasterComponent;
  let fixture: ComponentFixture<PersMasterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PersMasterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PersMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
