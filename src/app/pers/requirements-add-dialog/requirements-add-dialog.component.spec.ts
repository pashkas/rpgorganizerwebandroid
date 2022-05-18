import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RequirementsAddDialogComponent } from './requirements-add-dialog.component';

describe('RequirementsAddDialogComponent', () => {
  let component: RequirementsAddDialogComponent;
  let fixture: ComponentFixture<RequirementsAddDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RequirementsAddDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequirementsAddDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
