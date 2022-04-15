import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskTimerComponentComponent } from './task-timer-component.component';

describe('TaskTimerComponentComponent', () => {
  let component: TaskTimerComponentComponent;
  let fixture: ComponentFixture<TaskTimerComponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TaskTimerComponentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskTimerComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
