import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SyncModuleComponent } from './sync-module.component';

describe('SyncModuleComponent', () => {
  let component: SyncModuleComponent;
  let fixture: ComponentFixture<SyncModuleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SyncModuleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SyncModuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
