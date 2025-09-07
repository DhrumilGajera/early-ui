import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type Screen =
  | 'DASH' | 'NEW' | 'SCRIPT' | 'PKGS' | 'PKG_DETAIL'
  | 'EXEC' | 'RUNS' | 'EVID' | 'COVERAGE';

interface Step {
  id: string;
  action: string;
  target: string;
  assert: string;
  selector?: string;
  value?: string;
}

interface Script {
  id: string;
  name: string;
  spec: string;
  owner: string;
  last: 'pass' | 'fail' | '-' | string;
  types: Array<'happy' | 'edge' | 'negative' | string>;
  steps: Step[];
}

interface Pkg {
  id: string;
  name: string;
  scripts: string[];
  lastRun: { status: 'partial' | 'done' | 'failed' | '-' | string; passed: number; failed: number };
  schedule: string;
  env: string;
  dataset: string;
}

interface EvidenceItem {
  ts: string;      // ISO date
  text: string;
  screenshot?: string;
}

type JobStatus = 'queued' | 'running' | 'done' | 'failed';

interface Job {
  id: string;                 // RUN-xxxx
  kind: 'script' | 'package';
  refId: string;              // script/package id
  mode: 'dry' | 'full';
  status: JobStatus;
  progress: number;           // 0-100
  logs: string[];
  evidence: EvidenceItem[];
  startedAt: string | null;   // ISO
  finishedAt: string | null;  // ISO
}

interface ConfigSpec { id: string; title: string; }
interface ConfigProj { id: string; name: string; specs: ConfigSpec[]; }
@Component({
  selector: 'app-testing-automation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './testing-automation.component.html',
  styleUrl: './testing-automation.component.scss'
})
export class TestingAutomationComponent implements OnInit, OnDestroy {
  readonly BRAND = '#052c65';

  // ======= STATE =======
  screen: Screen = 'DASH';

  scripts: Script[] = [
    {
      id: 'T-1001',
      name: 'JE Approval > 50k requires 2-step',
      spec: 'FIN-APR-001',
      owner: 'Jane',
      last: 'pass',
      types: ['happy'],
      steps: []
    },
    {
      id: 'T-1002',
      name: 'VAT code creation EU',
      spec: 'TAX-VAT-2025',
      owner: 'Raj',
      last: 'fail',
      types: ['edge'],
      steps: []
    },
    {
      id: 'T-1003',
      name: 'SAC job nightly schedule',
      spec: 'INT-SAC-001',
      owner: 'Eerly',
      last: 'pass',
      types: ['happy'],
      steps: []
    },
  ];

  packages: Pkg[] = [
    {
      id: 'P-200',
      name: 'Finance Month-End',
      scripts: ['T-1001', 'T-1003'],
      lastRun: { status: 'partial', passed: 1, failed: 1 },
      schedule: 'Nightly 02:00',
      env: 'UAT',
      dataset: 'UAT-1'
    }
  ];

  selectedScript: Script | null = null;
  selectedPackage: Pkg | null = null;

  queue: Job[] = [];
  currentRunId: string | null = null;

  // Tick timer (created on first job)
  private runsTimer: any = null;

  // UI helpers / local state (menus, filters, modal)
  topMenuOpen = false;
  dashSearchTerm = '';
  dashStatusFilter: 'all' | 'pass' | 'fail' = 'all';
  runMenuOpenFor: string | null = null;      // for rows in table
  edRunMenuOpen = false;                      // in editor
  importOpen = false;

  // NEW screen inputs
  newPrompt = '';
  newSpec = 'FIN-APR-001';
  newHappy = true;
  newEdge = false;
  newNeg = false;
  newDraft: Step[] = [];

  // PKG creation selections
  pkgName = '';
  pkgEnv = 'UAT';
  pkgData = 'UAT-1';
  pkgInclude: Record<string, boolean> = {};

  // EXEC actions guard (ARIA live like)
  ariaLive = '';

  // RUNS filter
  runsSearch = '';

  // Minimal pill mapping
  pillClasses = {
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-700'
  } as const;

  CONFIG_HUB: ConfigProj[] = [
    {
      id: 'PRJ-FIN-001',
      name: 'Finance Rapid Template',
      specs: [
        { id: 'FIN-APR-001', title: 'JE approval > 50k (net)' },
        { id: 'INT-SAC-001', title: 'SAC job nightly' },
        { id: 'TAX-VAT-2025', title: 'EU VAT set' },
      ]
    },
    {
      id: 'PRJ-HCM-EC',
      name: 'SuccessFactors Core HR',
      specs: [
        { id: 'EC-HIRE-001', title: 'Hire employee' },
        { id: 'TIME-ABS-002', title: 'Approve absence' },
      ]
    },
  ];

  // ======= LIFECYCLE =======
  ngOnInit(): void {
    // Seed steps for initial scripts
    this.scripts = this.scripts.map(s => ({ ...s, steps: this.genSteps(s.spec) }));
  }

  ngOnDestroy(): void {
    if (this.runsTimer) {
      clearInterval(this.runsTimer);
      this.runsTimer = null;
    }
  }

  // ======= HELPERS =======
  setScreen(next: Screen) {
    this.screen = next;
    // Close any open menus when switching
    this.runMenuOpenFor = null;
    this.edRunMenuOpen = false;
  }

  uid(): string {
    return Math.random().toString(36).slice(2, 9);
  }

  genSteps(prompt?: string): Step[] {
    const steps: Step[] = [
      {
        id: this.uid(), action: 'Open', target: 'SAP Fiori Launchpad',
        assert: "Title contains 'Launchpad'", selector: 'role=application[name=Launchpad]'
      },
      {
        id: this.uid(), action: 'Login', target: 'Payroll Manager',
        assert: 'User role = PAYROLL_MANAGER', selector: '[data-role=login-button]'
      },
      {
        id: this.uid(), action: 'Navigate', target: 'Create Journal Entry',
        assert: 'Form visible', selector: 'text=Create Journal Entry'
      },
      {
        id: this.uid(), action: 'Input', target: 'Amount', value: '> 50000',
        assert: 'Dual approval required', selector: "input[name='amount']"
      },
      {
        id: this.uid(), action: 'Submit', target: 'Save',
        assert: 'Status = Pending Approval', selector: "button:has-text('Save')"
      },
    ];
    const p = prompt || '';
    if (/(payroll)/i.test(p)) {
      steps.push({
        id: this.uid(), action: 'Navigate', target: 'Payroll Results',
        assert: 'Results table loaded', selector: 'text=Payroll Results'
      });
    }
    if (/(integration|sac)/i.test(p)) {
      steps.push({
        id: this.uid(), action: 'Verify Job', target: 'SAC Nightly Feed',
        assert: 'Next run scheduled', selector: 'text=SAC Nightly Feed'
      });
    }
    return steps;
  }
  activeChild: string = 'NEW';
  // ======= TOP BAR =======
  goDash() { this.activeChild = 'DASH'; this.setScreen('DASH'); }
  topNew() { this.activeChild = 'NEW'; this.setScreen('NEW'); }
  topPkgs() { this.activeChild = 'PKGS'; this.setScreen('PKGS'); }
  topRuns() { this.activeChild = 'RUNS'; this.setScreen('RUNS'); }
  topEvid() { this.activeChild = 'EVID';this.setScreen('EVID'); }
  // topCov() { this.setScreen('COVERAGE'); }
  openImport() { this.importOpen = true; }
  closeImport() { this.importOpen = false; }

  doImport(proj: ConfigProj) {
    // New scripts at top (matching original behavior)
    const created: Script[] = proj.specs.map((sp, idx) => ({
      id: `T-${2000 + this.scripts.length + idx + 1}`,
      name: `${sp.title} – Happy path`,
      spec: sp.id,
      owner: 'Eerly',
      last: '-',
      types: ['happy'],
      steps: this.genSteps(sp.id)
    }));
    this.scripts = [...created, ...this.scripts];
    this.closeImport();
    this.setScreen('DASH');
  }

  // ======= DASH =======
  get dashFiltered(): Script[] {
    const q = (this.dashSearchTerm || '').toLowerCase();
    const st = this.dashStatusFilter;
    return this.scripts.filter(s => {
      const matchesQ = !q || (s.name + s.id + s.spec).toLowerCase().includes(q);
      const matchesStatus = st === 'all' || s.last === st;
      return matchesQ && matchesStatus;
    });
  }

  kpiTotals() {
    const total = this.scripts.length;
    const passed = this.scripts.filter(s => s.last === 'pass').length;
    const failed = this.scripts.filter(s => s.last === 'fail').length;
    const coverage = Math.round((passed / Math.max(1, total)) * 100);
    const active = this.queue.filter(q => q.status === 'queued' || q.status === 'running').length;
    return { total, passed, failed, coverage, active };
  }

  openEditorById(id: string) {
    const s = this.scripts.find(x => x.id === id) || null;
    this.selectedScript = s;
    this.setScreen('SCRIPT');
  }

  // Run menu on DASH
  toggleRunMenuFor(id: string) {
    this.runMenuOpenFor = this.runMenuOpenFor === id ? null : id;
  }

  // ======= ENQUEUE / JOB ENGINE =======
  enqueueRun(kind: 'script' | 'package', refId: string, mode: 'dry' | 'full'): string {
    const id = 'RUN-' + this.uid().toUpperCase();
    const job: Job = {
      id, kind, refId, mode,
      status: 'queued',
      progress: 0,
      logs: ['Queued'],
      evidence: [],
      startedAt: null,
      finishedAt: null
    };
    this.queue.push(job);

    // small delay to "start"
    setTimeout(() => {
      const j = this.queue.find(x => x.id === id);
      if (!j) return;
      j.status = 'running';
      j.logs = ['Run started'];
      j.startedAt = new Date().toISOString();
    }, 300);

    // start global timer if not yet started
    if (!this.runsTimer) {
      this.runsTimer = setInterval(() => this.tickJobs(), 900);
    }
    return id;
  }

  private tickJobs() {
    let anyRunning = false;
    this.queue = this.queue.map(job => {
      if (job.status !== 'running') return job;
      anyRunning = true;
      const inc = Math.ceil(Math.random() * 10);
      const next = Math.min(100, job.progress + inc);
      job.progress = next;
      job.logs.push(`${new Date().toLocaleTimeString()} • ${job.kind} ${job.refId}: ${next}%`);
      if (next >= 100) {
        job.status = Math.random() < 0.9 ? 'done' : 'failed';
        job.finishedAt = new Date().toISOString();
      }
      return job;
    });

    // Stop timer if nothing runs and nothing queued
    if (!anyRunning && !this.queue.some(j => j.status === 'queued')) {
      clearInterval(this.runsTimer);
      this.runsTimer = null;
    }

    // live update aria
    this.updateExecAria();
  }

  get currentRun(): Job | null {
    return this.queue.find(j => j.id === this.currentRunId) || null;
  }

  // ======= NEW =======
  genFromPrompt() {
    this.newDraft = this.genSteps(this.newPrompt || this.newSpec);
  }
  genFromTemplate() {
    this.newDraft = this.genSteps('');
  }
  canSaveNew(): boolean {
    return this.newDraft.length > 0 && (!!this.newPrompt || !!this.newSpec);
  }
  saveNew() {
    if (!this.canSaveNew()) return;
    const id = 'T-' + (1000 + this.scripts.length + 1);
    const types: Script['types'] = [];
    if (this.newHappy) types.push('happy');
    if (this.newEdge) types.push('edge');
    if (this.newNeg) types.push('negative');
    const newScript: Script = {
      id,
      name: this.newPrompt ? this.newPrompt.slice(0, 40) : ('New Script ' + id),
      spec: this.newSpec || 'FIN-APR-001',
      owner: 'You',
      last: '-',
      types: types.length ? types : ['happy'],
      steps: this.newDraft
    };
    this.scripts = [newScript, ...this.scripts];
    this.selectedScript = newScript;
    this.setScreen('SCRIPT');
  }
  removeDraftStep(stepId: string) {
    this.newDraft = this.newDraft.filter(s => s.id !== stepId);
  }

  // ======= SCRIPT (Editor) =======
  get editScript(): Script | null {
    return this.selectedScript ?? (this.scripts[0] || null);
  }

  // bindings for editor inputs update the live object
  updateStepField(idx: number, key: 'action' | 'target' | 'assert' | 'selector', val: string) {
    const s = this.editScript;
    if (!s) return;
    s.steps[idx] = { ...s.steps[idx], [key]: val };
  }
  moveStepUp(idx: number) {
    const s = this.editScript; if (!s || idx <= 0) return;
    [s.steps[idx - 1], s.steps[idx]] = [s.steps[idx], s.steps[idx - 1]];
  }
  moveStepDown(idx: number) {
    const s = this.editScript; if (!s || idx >= s.steps.length - 1) return;
    [s.steps[idx + 1], s.steps[idx]] = [s.steps[idx], s.steps[idx + 1]];
  }
  addStep() {
    const s = this.editScript; if (!s) return;
    s.steps.push({
      id: this.uid(),
      action: 'Click',
      target: 'Approve Button',
      assert: 'Dialog closes',
      selector: "button:has-text('Approve')"
    });
  }
  clearSteps() {
    const s = this.editScript; if (!s) return;
    s.steps = [];
  }
  saveScript() {
    const s = this.editScript; if (!s) return;
    // name is bound with ngModel, so just acknowledge
    // window.alert('Script saved');
  }

  toggleEdRunMenu() {
    this.edRunMenuOpen = !this.edRunMenuOpen;
  }

  runScript(mode: 'dry' | 'full') {
    const s = this.editScript; if (!s) return;
    this.currentRunId = this.enqueueRun('script', s.id, mode);
    this.setScreen('EXEC');
  }

  // Self-healing
  applyHeal() {
    const s = this.editScript; if (!s) return;
    const amtIdx = s.steps.findIndex(x => /Amount/i.test(x.target));
    if (amtIdx >= 0) {
      s.steps[amtIdx] = {
        ...s.steps[amtIdx],
        selector: "role=textbox[name='Amount'][aria-invalid=false]"
      };
      // window.alert('Applied new selector');
    }
  }
  applyHealAndRun() {
    this.applyHeal();
    this.runScript('full');
  }

  // Mini “Ask Eerly”
  miniMsg = '';
  miniSend() {
    const v = (this.miniMsg || '').trim();
    if (!v) return;
    // window.alert('Eerly suggests selector for: ' + v);
    this.miniMsg = '';
  }

  // ======= PACKAGES =======
  createPackage() {
    const name = (this.pkgName || '').trim();
    if (!name) {
      // window.alert('Name required');
      return;
    }
    const ids = Object.keys(this.pkgInclude).filter(k => this.pkgInclude[k]);
    if (ids.length === 0) {
      // window.alert('Select at least one script'); 
      return;
    }
    const pkg: Pkg = {
      id: 'P-' + (200 + this.packages.length),
      name,
      scripts: ids,
      lastRun: { status: '-', passed: 0, failed: 0 },
      schedule: 'Ad hoc',
      env: this.pkgEnv,
      dataset: this.pkgData
    };
    this.packages = [pkg, ...this.packages];
    // Reset left panel selections minimally
    this.pkgName = '';
    this.pkgInclude = {};
    this.setScreen('PKGS');
  }

  openPkgDetail(p: Pkg) {
    this.selectedPackage = p;
    this.setScreen('PKG_DETAIL');
  }
  runPackage(p: Pkg, mode: 'full' | 'dry' = 'full') {
    this.currentRunId = this.enqueueRun('package', p.id, mode);
    this.setScreen('EXEC');
  }

  // ======= PKG DETAIL =======
  scriptsByIds(ids: string[]): Script[] {
    return ids.map(id => this.scripts.find(s => s.id === id)).filter(Boolean) as Script[];
  }

  // ======= EXEC =======
  exStart() {
    const j = this.currentRun; if (!j) return;
    j.status = 'running';
  }
  exPause() {
    const j = this.currentRun; if (!j) return;
    j.status = 'queued';
  }
  exStop() {
    const j = this.currentRun; if (!j) return;
    j.status = 'failed';
    j.finishedAt = new Date().toISOString();
  }
  exDownload() {
    // window.alert('Downloading evidence bundle...');
  }
  exShot() {
    const j = this.currentRun; if (!j) return;
    (j.evidence = j.evidence || []).push({
      ts: new Date().toISOString(),
      text: 'Manual screenshot',
      screenshot: 'https://placehold.co/600x360?text=Manual'
    });
    this.updateExecAria();
  }
  exNote() {
    const j = this.currentRun; if (!j) return;
    (j.evidence = j.evidence || []).push({
      ts: new Date().toISOString(),
      text: 'Note added by user'
    });
    this.updateExecAria();
  }
  private updateExecAria() {
    const j = this.currentRun;
    if (!j) { this.ariaLive = ''; return; }
    this.ariaLive = `${j.progress || 0}%`;
  }

  // ======= RUNS =======
  get filteredRuns(): Job[] {
    const f = (this.runsSearch || '').toLowerCase();
    return this.queue.slice().reverse().filter(j =>
      !f || (j.id + j.refId).toLowerCase().includes(f)
    );
  }
  openRun(jobId: string) {
    this.currentRunId = jobId;
    this.setScreen('EXEC');
  }

  // ======= EVIDENCE =======
  get allEvidence(): Array<EvidenceItem & { jobId: string; kind: string; ref: string }> {
    const items: Array<EvidenceItem & { jobId: string; kind: string; ref: string }> = [];
    this.queue.forEach(job => (job.evidence || []).forEach(e => items.push({
      jobId: job.id,
      kind: job.kind,
      ref: job.refId,
      ...e
    })));
    // newest first
    return items.slice().reverse();
  }

  // ======= COVERAGE =======
  get coverageRows(): Array<{ id: string; happy: boolean; edge: boolean; negative: boolean }> {
    const ids = Array.from(new Set(this.scripts.map(s => s.spec)));
    return ids.map(id => {
      const related = this.scripts.filter(s => s.spec === id);
      return {
        id,
        happy: related.some(s => (s.types || []).includes('happy')),
        edge: related.some(s => (s.types || []).includes('edge')),
        negative: related.some(s => (s.types || []).includes('negative')),
      };
    });
  }
  fixCoverageFor(specId: string) {
    const row = this.coverageRows.find(x => x.id === specId);
    if (!row) return;
    const gaps: Array<'edge' | 'negative'> = [];
    if (!row.edge) gaps.push('edge');
    if (!row.negative) gaps.push('negative');
    const created: Script[] = [];
    gaps.forEach(g => {
      created.push({
        id: 'T-' + (1000 + this.scripts.length + created.length + 1),
        name: `${specId} – ${g === 'edge' ? 'Edge' : 'Negative'} case`,
        spec: specId,
        owner: 'Eerly',
        last: '-',
        types: [g],
        steps: this.genSteps(`${specId} ${g}`)
      });
    });
    this.scripts = [...created, ...this.scripts];
    // window.alert(`Generated ${created.length} test(s) for ${specId}`);
    // this.setScreen('COVERAGE');
  }

  // ======= UTILS FOR TEMPLATE =======
  isPassing(s: Script) { return s.last === 'pass'; }
  isFailing(s: Script) { return s.last === 'fail'; }

  pill(text: string, tone: keyof TestingAutomationComponent['pillClasses'] | undefined) {
    const cls = this.pillClasses[tone || 'gray'] || this.pillClasses.gray;
    return { text, cls };
  }

  // For editor “before” selector display
  get healBeforeSelector(): string {
    const s = this.editScript;
    if (!s) return "input[name='amount']";
    const amt = (s.steps || []).find(x => /Amount/i.test(x.target));
    return (amt && (amt.selector || "input[name='amount']")) || "input[name='amount']";
  }

  trackByScriptId(index: number, script: any): string {
    return script.id;
  }
}
