import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'new-project', pathMatch: 'full' },

  {
    path: 'new-project',
    loadComponent: () =>
      import('../components/new-project/new-project.component').then(
        (m) => m.NewProjectComponent
      ),
  },
  {
    path: 'workspace',
    loadComponent: () =>
      import('../components/post-build/post-build.component').then(
        (m) => m.PostBuildComponent
      ),
  },
  {
    path: 'signoff-build',
    loadComponent: () =>
      import('../components/signoff-build/signoff-build.component').then(
        (m) => m.SignoffBuildComponent
      ),
  },
  {
    path: 'build-orchestrator',
    loadComponent: () =>
      import('../components/build-orchestrator/build-orchestrator.component').then(
        (m) => m.BuildOrchestratorComponent
      ),
  },
  {
    path: 'existing-customer',
    loadComponent: () =>
      import('../components/existing-customer/existing-customer.component').then(
        (m) => m.ExistingCustomerComponent
      ),
  },
  {
    path: 'migration',
    loadComponent: () =>
      import('../components/migration/migration.component').then(
        (m) => m.MigrationComponent
      ),
  },
  {
    path: 'testing-automation',
    loadComponent: () =>
      import('../components/testing-automation/testing-automation.component').then(
        (m) => m.TestingAutomationComponent
      ),
  },
  {
    path: 'data-transformation',
    loadComponent: () =>
      import('../components/data-transformation/data-transformation.component').then(
        (m) => m.DataTransformationComponent
      ),
  },
  {
    path: 'insight-engine',
    loadComponent: () =>
      import('../components/insight-engine/insight-engine.component').then(
        (m) => m.InsightEngineComponent
      ),
  },

  { path: '**', redirectTo: 'new-project' },
];
