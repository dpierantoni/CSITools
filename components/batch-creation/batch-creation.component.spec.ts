import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatchCreationComponent } from './batch-creation.component';

describe('BatchCreationComponent', () => {
  let component: BatchCreationComponent;
  let fixture: ComponentFixture<BatchCreationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BatchCreationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BatchCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
