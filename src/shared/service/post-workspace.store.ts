import { Injectable, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class PostWorkspaceStore {
  brand = '#052c65'; tab = signal<'spec' | 'tests' | 'changes' | 'optimizations' | 'evidence'>('spec');
  project = signal({ projectId: 'PRJ-2043', projectName: 'ACME S/4 Finance Rollout', versionId: 'v0.9', versionHash: '6F3A7C12B9F0' });
  tests = signal([{ id: 'T-1001', name: 'JE Approval >50k requires 2-step', type: 'happy', owner: 'Jane', status: 'pass' }]);
  changes = signal([{ id: 'CR-21', title: 'JE approval threshold 40k→50k', area: 'Finance', status: 'implemented' }]);
  optimizations = signal([{ id: 'OPT-06', title: 'Archive old tax codes (auto)', impact: 'medium', status: 'backlog' }]);
  evidence = signal([{ id: 'EV-01', label: 'JE approval config screenshot', link: '#', accepted: true }]);
  setTab(t: any) { this.tab.set(t); }
  setEvidenceAccepted(id: string, accepted: boolean) { this.evidence.update(l => l.map(e => e.id === id ? { ...e, accepted } : e)); }
  setTestStatus(id: string, status: any) { this.tests.update(l => l.map(t => t.id === id ? { ...t, status } : t)); }
}
