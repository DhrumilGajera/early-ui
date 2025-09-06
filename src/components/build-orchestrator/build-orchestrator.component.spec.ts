import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuildOrchestratorComponent } from './build-orchestrator.component';

describe('BuildOrchestratorComponent', () => {
  let component: BuildOrchestratorComponent;
  let fixture: ComponentFixture<BuildOrchestratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuildOrchestratorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuildOrchestratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
