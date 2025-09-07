import { Component, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
interface TargetOption {
  id: string;
  label: string;
  desc: string;
}

interface FitItem {
  area: string;
  fit: number;
  ecc: string[];
  target: string[];
  action: string;
  risk: string;
}

@Component({
  selector: 'app-migration',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './migration.component.html',
  styleUrl: './migration.component.scss'
})
export class MigrationComponent implements OnDestroy {
  // Stepper screens & labels
  screens = ['HOME', 'SCAN', 'FITGAP', 'BLUEPRINT', 'DATAINT', 'ROADMAP', 'SIGN'];
  labels = ['Home','Scan','Fit-Gap','Blueprint','Data & Integration','Roadmap','Sign-Off'];
  active = 'HOME';

  // Targets
  targets: TargetOption[] = [
    { id: 's4-public', label: 'S/4HANA Public Cloud', desc: 'Best-practice scope; strong guardrails' },
    { id: 's4-private', label: 'S/4HANA Private Cloud', desc: 'Flexibility; extensibility for Z-logic' },
    { id: 'sf-suite', label: 'SuccessFactors (EC/Payroll)', desc: 'HR & Payroll modernization' }
  ];
  selectedTarget = 's4-public';

  // Checklist
  checklist: { label: string; status: 'pending'|'done' }[] = [
    { label: 'Connect to ECC', status: 'pending' },
    { label: 'Scan custom objects & transports', status: 'pending' },
    { label: 'Fit-Gap to target landing', status: 'pending' },
    { label: 'Build migration blueprint', status: 'pending' },
    { label: 'Sign-off & generate playbook', status: 'pending' }
  ];

  // Scan
  scanRunning = false;
  scanPct = 0;
  scanEvents: string[] = [];
  private scanTimer: any = null;

  // Fit-Gap items (converted from your original)
  fitItems: FitItem[] = [
    { area: 'Finance', fit: 78, ecc: ['JE approval (custom)','Z reports'], target: ['Standard workflow','Embedded analytics'], action: 'Reconfigure + de-customize', risk: 'Medium' },
    { area: 'Logistics', fit: 62, ecc: ['Z shipment tables'], target: ['TM standard'], action: 'Redesign', risk: 'High' },
    { area: 'HR', fit: 70, ecc: ['Payroll custom rules'], target: ['ECP'], action: 'Migrate to target suite', risk: 'Medium' }
  ];

  // Blueprint
  bp = [
    { id: 's1', from: 'JE Approval', to: 'S/4 Standard Workflow', impact: 'Medium', effort: 'M', accepted: false },
    { id: 's2', from: 'Z Shipment Tables', to: 'TM Standard', impact: 'High', effort: 'L', accepted: false },
    { id: 's3', from: 'PA/OM + Payroll', to: 'EC + ECP', impact: 'Medium', effort: 'L', accepted: false }
  ];

  // Roadmap phases
  phases = [
    { id: 1, name: 'Foundation', months: 1, notes: 'Landing zone, security, connectivity' },
    { id: 2, name: 'Core Finance', months: 3, notes: 'JE workflow, de-customize' },
    { id: 3, name: 'Logistics Extension', months: 4, notes: 'TM redesign' },
    { id: 4, name: 'HR/Payroll', months: 2, notes: 'EC/ECP' }
  ];

  // Approvers / Sign-off
  approvers = [
    { id: 'a1', name: 'Finance Lead', role: 'Approver', status: 'pending' },
    { id: 'a2', name: 'IT Lead', role: 'Reviewer', status: 'pending' },
    { id: 'a3', name: 'HR Lead', role: 'Approver', status: 'approved' }
  ];

  // Sync / helper data
  bpReady = false;

  constructor(private ngZone: NgZone) {}

  // -----------------------
  // Getters used in template (no arrow funcs in template)
  // -----------------------
  get selectedTargetLabel(): string {
    const t = this.targets.find(x => x.id === this.selectedTarget);
    return t ? t.label : '';
  }

  // -----------------------
  // Navigation
  // -----------------------
  switchTo(id: string) {
    this.active = id;
  }

  // -----------------------
  // Scan logic (preserves original behavior)
  // -----------------------
  startScan() {
    if (this.scanRunning) return;
    this.scanRunning = true;
    this.scanPct = 0;
    this.scanEvents = [];
    this.scanEvents.push('Connected via RFC & OData (read-only)');

    // Use NgZone to ensure change detection updates
    this.scanTimer = setInterval(() => {
      this.ngZone.run(() => {
        this.scanPct = Math.min(100, this.scanPct + 10);

        if (this.scanPct === 30) this.scanEvents.push('Customizing tables read (FIN, LOG, HR)');
        if (this.scanPct === 50) this.scanEvents.push('Detected 120 Z-tables, 45 user exits');
        if (this.scanPct === 70) this.scanEvents.push('Transport history normalized');
        if (this.scanPct === 90) this.scanEvents.push('Loaded target compatibility matrix');
        if (this.scanPct === 100) {
          if (this.scanTimer) { clearInterval(this.scanTimer); this.scanTimer = null; }
          this.scanRunning = false;
          this.scanEvents.push('Scan complete');
        }
      });
    }, 500);
  }

  resetScan() {
    if (this.scanTimer) { clearInterval(this.scanTimer); this.scanTimer = null; }
    this.scanRunning = false;
    this.scanPct = 0;
    this.scanEvents = [];
  }

  // -----------------------
  // Fit-Gap render / blueprint logic
  // (these functions update component state and are invoked from template)
  // -----------------------
  viewFitGap() {
    this.switchTo('FITGAP');
  }

  // Blueprint accept toggles (two-way via ngModel in template)
  toggleBpAccept(i: number) {
    this.bp[i].accepted = !this.bp[i].accepted;
    this.updateBpReady();
  }

  updateBpReady() {
    this.bpReady = this.bp.every(x => x.accepted);
  }

  continueFromBlueprint() {
    if (!this.bpReady) return;
    this.switchTo('DATAINT');
  }

  // -----------------------
  // Roadmap editing helpers
  // -----------------------
  updatePhaseMonths(index: number, value: number | string) {
    const months = Number(value || 0);
    this.phases[index].months = months;
  }

  get totalPhaseMonths(): number {
    return this.phases.reduce((acc, p) => acc + Number(p.months || 0), 0);
  }

  // -----------------------
  // Sign-off helpers
  // -----------------------
  renderApprovals() {
    // kept for parity with original code style; template uses approvers array
  }

  approverAction(idx: number, status: 'approved'|'rejected') {
    this.approvers[idx].status = status;
  }

  get signReady(): boolean {
    const need = this.approvers.filter(a => a.role === 'Approver').length;
    const done = this.approvers.filter(a => a.role === 'Approver' && a.status === 'approved').length;
    return need > 0 && done === need;
  }

  signOff() {
    if (!this.signReady) return;
    try {
      localStorage.setItem('eerly_open_post_build', JSON.stringify({
        projectId: 'PRJ-2043',
        projectName: 'ECC → Cloud Migration',
        versionId: 'mig-v1.0',
        versionHash: 'M1GPL4N9SHA'
      }));
    } catch (e) {}
    // alert('Plan signed. Handoff token saved for Integrated Workspace.');
  }

  openWorkspace() {
    try {
      localStorage.setItem('eerly_open_post_build', JSON.stringify({
        projectId: 'PRJ-2043',
        projectName: 'ECC → Cloud Migration',
        versionId: 'mig-v1.0',
        versionHash: 'M1GPL4N9SHA'
      }));
    } catch (e) {}
    // alert('Open Integrated Workspace to continue.');
  }

  openHerePostView() {
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'post');
    window.open(url.toString(), '_blank');
  }

  ngOnDestroy(): void {
    if (this.scanTimer) clearInterval(this.scanTimer);
  }
}
