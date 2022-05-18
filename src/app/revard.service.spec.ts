import { TestBed } from '@angular/core/testing';

import { RevardService } from './revard.service';

describe('RevardService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RevardService = TestBed.get(RevardService);
    expect(service).toBeTruthy();
  });
});
