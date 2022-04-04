import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickAddAbilityComponent } from './quick-add-ability.component';

describe('QuickAddAbilityComponent', () => {
  let component: QuickAddAbilityComponent;
  let fixture: ComponentFixture<QuickAddAbilityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QuickAddAbilityComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuickAddAbilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
