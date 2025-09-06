import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestingAutomationComponent } from './testing-automation.component';

describe('TestingAutomationComponent', () => {
  let component: TestingAutomationComponent;
  let fixture: ComponentFixture<TestingAutomationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestingAutomationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestingAutomationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
