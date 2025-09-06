import { Injectable, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class SignoffBuildStore {
  brand = '#052c65'; stage = signal<'signoff' | 'build'>('signoff');
  ctx = signal({ projectId: 'PRJ-2043', projectName: 'ACME S/4 Finance', specDocId: 'DOC-11', specDocTitle: 'Finance Spec', versionId: 'v0.9', versionHash: '6F3A7C12B9F0', signed: false });
  reviewers = signal([{ id: 'u1', name: 'CFO (Finance)', role: 'Approver', status: 'pending' }, { id: 'u3', name: 'Tax Lead', role: 'Approver', status: 'approved' }]);
  phase = signal<'idle' | 'running' | 'completed'>('idle'); progress = signal(0);
  tasks = signal([{ id: 't1', area: 'Finance', name: 'Create Company Codes 1000,1100', status: 'pending' },
  { id: 't2', area: 'Finance', name: 'Configure JE approval (2-step >50k)', status: 'pending' },
  { id: 't3', area: 'Tax', name: 'Load EU-VAT-2025 code set', status: 'pending' },
  { id: 't4', area: 'Integrations', name: 'Setup SAC nightly feed', status: 'pending' }]);
  logs = signal<string[]>([]);
  approve(id: string) { this.reviewers.update(l => l.map(r => r.id === id ? { ...r, status: 'approved' } : r)); }
  reject(id: string) { this.reviewers.update(l => l.map(r => r.id === id ? { ...r, status: 'rejected' } : r)); }
  canSign() { const req = this.reviewers().filter(r => r.role === 'Approver').length; const ok = this.reviewers().filter(r => r.role === 'Approver' && r.status === 'approved').length; return req === ok; }
  finalSign() { if (!this.canSign()) return; this.ctx.update(c => ({ ...c, signed: true })); }
  setStatus(id: string, s: any) { this.tasks.update(l => l.map(t => t.id === id ? { ...t, status: s } : t)); }
  startRun() {
    this.stage.set('build'); this.phase.set('running'); this.progress.set(0); this.logs.set(['Build started']);
    import('timers').then(() => { });
  }
}
