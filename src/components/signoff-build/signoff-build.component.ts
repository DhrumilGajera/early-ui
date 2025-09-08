import { Component, inject } from '@angular/core';
import { SignoffBuildStore } from '../../shared/service/signoff-build.store';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type View = 'signoff' | 'build';
type ApproveStatus = 'pending' | 'approved' | 'changes_requested';
type TaskStatus = 'queued' | 'running' | 'blocked' | 'done';

interface Ctx {
  project: string;
  stream: string;
  environment: 'DEV' | 'QA' | 'UAT' | 'PROD';
  owner: string;
}

interface Version {
  id: string;
  label: string;
  author: string;
  date: string;          // display string
  summary: string;
  changes: string[];     // list of change lines
}

interface Approver {
  name: string;
  role: string;
  status: ApproveStatus;
  note?: string;
}

interface TaskItem {
  id: string;
  name: string;
  owner: string;
  status: TaskStatus;
  eta?: string;
  log?: string[];
}

interface ExceptionItem {
  id: string;
  when: string;
  area: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  resolved?: boolean;
}

interface Insight {
  when: string;
  text: string;
}
@Component({
  selector: 'app-signoff-build',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signoff-build.component.html',
  styleUrl: './signoff-build.component.scss'
})
export class SignoffBuildComponent {
  isPaused = false;
  // ---------------- Context ----------------
  ctx = {
    projectName: 'ACME S/4 Finance',
    projectId: 'PRJ-2043',
    specDocTitle: 'Finance Spec',
    specDocId: 'DOC-11',
    versionId: 'v0.9',
    signed: false
  };

  view: 'signoff' | 'build' = 'signoff';

  // ---------------- Versions ----------------
  versions = [
    {
      id: 'v0.7', label: 'v0.7 Draft', author: 'Jane',
      ts: Date.now() - 1000 * 60 * 60 * 30,
      content: { execObjective: 'Enable JE posting with 2-step approval for amounts over 50k; harmonize EU VAT codes.' }
    },
    {
      id: 'v0.8', label: 'v0.8 Draft', author: 'Raj',
      ts: Date.now() - 1000 * 60 * 60 * 10,
      content: { execObjective: 'Enable JE posting with 2-step approval for amounts over 50k (net); harmonize EU VAT codes. SAC nightly feed.' }
    },
    {
      id: 'v0.9', label: 'v0.9 Review', author: 'Eerly',
      ts: Date.now() - 1000 * 60 * 60 * 2,
      content: { execObjective: 'Enable 2-step JE approval for amounts over 50k (net), standardized EU VAT codes; SAC nightly reporting feed.' }
    }
  ];
  selectedLeft = 'v0.7';
  selectedRight = 'v0.9';

  // ---------------- Approvals ----------------
  reviewers = [
    { id: 'u1', name: 'Stake-holder-1', role: 'Approver', status: 'pending' },
    { id: 'u2', name: 'Stake-holder-2', role: 'Reviewer', status: 'pending' },
    { id: 'u3', name: 'Stake-holder-3', role: 'Approver', status: 'approved' }
  ];

  // ---------------- Build ----------------
  tasks: any[] = [];
  progress = 0;
  runTimer: any = null;
  exceptions: any[] = [];
  insights: any[] = [];

  ngOnInit(): void { }

  // -------- View toggle --------
  setView(v: 'signoff' | 'build') {
    this.view = v;
    if (v === 'build') this.initBuild();
  }

  // -------- Versions & Diff --------
  get leftVersion() { return this.versions.find(v => v.id === this.selectedLeft)!; }
  get rightVersion() { return this.versions.find(v => v.id === this.selectedRight)!; }

  get diffRemoved() {
    const L = this.leftVersion.content.execObjective.split(/\s+/);
    const R = this.rightVersion.content.execObjective.split(/\s+/);
    return L.filter(w => !R.includes(w)).slice(0, 15);
  }
  get diffAdded() {
    const L = this.leftVersion.content.execObjective.split(/\s+/);
    const R = this.rightVersion.content.execObjective.split(/\s+/);
    return R.filter(w => !L.includes(w)).slice(0, 15);
  }

  // -------- Approvals --------
  approveReviewer(idx: number, status: 'approved' | 'rejected') {
    this.reviewers[idx].status = status;
  }

  get approverStats() {
    const need = this.reviewers.filter(r => r.role === 'Approver').length;
    const done = this.reviewers.filter(r => r.role === 'Approver' && r.status === 'approved').length;
    return { need, done, ready: done === need };
  }

  finalSignOff() {
    this.ctx.signed = true;
    this.ctx.versionId = this.selectedRight;
  }

  // -------- Build Orchestrator --------
  initBuild() {
    this.tasks = [
      { id: 't1', area: 'Finance', name: 'Create Company Codes 1000,1100', status: 'pending', expanded: true, screenshots: [], evidence: [], logs: [] },
      { id: 't2', area: 'Finance', name: 'Configure JE approval (2-step >50k)', status: 'pending', expanded: false, screenshots: [], evidence: [], logs: [] },
      { id: 't3', area: 'Tax', name: 'Load EU-VAT-2025 code set', status: 'pending', expanded: false, screenshots: [], evidence: [], logs: [] },
      { id: 't4', area: 'Integrations', name: 'Setup SAC nightly feed', status: 'pending', expanded: false, screenshots: [], evidence: [], logs: [] }
    ];
    this.progress = 0;
    this.exceptions = [];
    this.insights = [];
  }
  get pendingCount() {
    return this.tasks.filter(t => t.status === 'pending').length;
  }
  get runningCount() {
    return this.tasks.filter(t => t.status === 'running').length;
  }
  get doneCount() {
    return this.tasks.filter(t => t.status === 'done').length;
  }
  get blockedCount() {
    return this.tasks.filter(t => t.status === 'blocked').length;
  }

  // Context
  // ctx = { signed: false, versionId: 'v0.9' };
  // view: 'signoff' | 'build' = 'signoff';

  // Tasks
  // tasks: any[] = [];
  // progress = 0;
  // runTimer: any = null;

  // Exceptions & insights
  // exceptions: any[] = [];
  // insights: any[] = [];

  // -------- Build Orchestrator --------
  // initBuild() {
  //   this.tasks = [
  //     { id: 't1', area: 'Finance', name: 'Create Company Codes 1000,1100', status: 'pending', expanded: true, screenshots: [], evidence: [], logs: [] },
  //     { id: 't2', area: 'Finance', name: 'Configure JE approval (2-step >50k)', status: 'pending', expanded: false, screenshots: [], evidence: [], logs: [] },
  //     { id: 't3', area: 'Tax', name: 'Load EU-VAT-2025 code set', status: 'pending', expanded: false, screenshots: [], evidence: [], logs: [] },
  //     { id: 't4', area: 'Integrations', name: 'Setup SAC nightly feed', status: 'pending', expanded: false, screenshots: [], evidence: [], logs: [] }
  //   ];
  //   this.progress = 0;
  //   this.exceptions = [];
  //   this.insights = [];
  // }

  // Start simulation
  startRun() {
    this.isRunning = true;
    this.isPaused = false;
    this.initBuild();
    this.startTimer();
  }

  isRunning = false;
  // isPaused = false;


  // Timer loop
  startTimer() {
    if (this.runTimer) clearInterval(this.runTimer);
    this.runTimer = setInterval(() => {
      this.progress = Math.min(100, this.progress + 5);

      if (this.progress === 5) this.setTaskRunning('t1');
      if (this.progress === 20) this.finishTask('t1', {
        screenshots: [
          { src: 'assets/images/screenshot-1.png', caption: 'SPRO: Company Code 1000 created' },
          { src: 'assets/images/screehshot-2.png', caption: 'SPRO: Company Code 1100 created' }
        ],
        evidence: ['Transport TR12345 exported', 'BAPI_COMPANYCODE_CREATE used'],
        logs: ['Created 1000', 'Created 1100']
      });
      if (this.progress === 25) this.setTaskRunning('t3');
      if (this.progress === 45) this.finishTask('t3', {
        screenshots: [{ src: 'assets/images/screehshot-3.png', caption: 'EU-VAT-2025 uploaded' }],
        evidence: ['EU-VAT-2025.xlsx imported', '57 codes validated'],
        logs: ['Upload start', 'Validation OK']
      });
      if (this.progress === 50) this.setTaskRunning('t2');
      if (this.progress === 65) this.blockTask('t2', 'Workflow transport import locked by change freeze (18:00–20:00)');
      if (this.progress === 70) this.setTaskRunning('t4');
      if (this.progress === 90) this.finishTask('t4', {
        screenshots: [{ src: 'assets/images/screehshot-4.png', caption: 'SAC job scheduled 02:00 UTC' }],
        evidence: ['SAC connection validated', 'Delta partition enabled'],
        logs: ['RFC ping ok', 'Cron saved']
      });

      if (this.progress >= 100) {
        clearInterval(this.runTimer);
        this.runTimer = null;
        this.finalizeRun();
      }
    }, 600);
  }

  pauseRun() {
    if (this.runTimer) {
      this.isPaused = true;
      this.isRunning = true;
      clearInterval(this.runTimer);
      this.runTimer = null;
    }
  }

  resumeRun() {
    if (!this.runTimer && this.progress < 100) {
      this.isRunning = false;
      this.isPaused = false;
      this.startTimer();
    }
  }

  stopRun() {
    if (this.runTimer) clearInterval(this.runTimer);
    this.isRunning = false;
    this.isPaused = false
    this.runTimer = null;
  }

  // Task state updates
  setTaskRunning(id: string) {
    const t = this.tasks.find(x => x.id === id);
    if (t) { t.status = 'running'; t.logs.push('Started'); }
  }

  finishTask(id: string, payload: any) {
    const t = this.tasks.find(x => x.id === id);
    if (t) {
      t.status = 'done';
      if (payload.logs) t.logs.push(...payload.logs);
      if (payload.screenshots) t.screenshots.push(...payload.screenshots);
      if (payload.evidence) t.evidence.push(...payload.evidence);
      t.logs.push('Completed');
    }
  }

  blockTask(id: string, reason: string) {
    const t = this.tasks.find(x => x.id === id);
    if (t) {
      t.status = 'blocked';
      t.logs.push('Blocked: ' + reason);
      this.exceptions.push({
        title: 'Task ' + id + ' blocked',
        detail: reason,
        action: 'Review transport window or override'
      });
    }
  }

  finalizeRun() {
    this.insights.push({
      title: 'Enable gzip on SAC feed',
      detail: 'Projected 38% reduction in transfer time.'
    });
  }

  // View switch
  // setView(v: 'signoff' | 'build') {
  //   this.view = v;
  //   if (v === 'build') this.initBuild();
  // }

  selectedImage: string | null = null;

  openImage(src: string) {
    this.selectedImage = src;
  }

  closeImage() {
    this.selectedImage = null;
  }
}
