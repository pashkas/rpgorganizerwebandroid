import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PersImportExportDialogComponent } from './pers-import-export-dialog.component';

describe('PersImportExportDialogComponent', () => {
  let component: PersImportExportDialogComponent;
  let fixture: ComponentFixture<PersImportExportDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PersImportExportDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PersImportExportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
