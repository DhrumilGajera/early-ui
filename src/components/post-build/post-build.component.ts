import { Component, inject } from '@angular/core';
import { PillComponent } from "../../shared/components/pill/pill.component";
import { KpiCardComponent } from "../../shared/components/kpi-card/kpi-card.component";
import { CommonModule } from '@angular/common';
import { PostWorkspaceStore } from '../../shared/service/post-workspace.store';
import { FormsModule } from '@angular/forms';
type Tab = 'overview' | 'workspace' | 'spec' | 'editor' | 'postbuild';
type DocTab = 'document' | 'processes';
type PbTab = 'spec' | 'tests' | 'changes' | 'optimizations' | 'evidence';

interface KPI { label: string; value: string | number; }
interface ChecklistItem { t: string; s: string; done: boolean; }

interface FeedItem { title: string; detail: string; }

interface CommentItem {
  id: string;
  anchor: string;
  text: string;
  author: string;
  status: 'open' | 'resolved';
  ts: Date;
}

interface ProcessNode { label: string; x: string; y: string; }

interface EdRow { field: string; value: string; note: string; }
interface EdComment {
  id: string;
  author: string;
  text: string;
  status: 'open' | 'resolved';
  anchor: string;
  ts: Date;
}
interface VersionItem { id: string; label: string; ts: Date; }
interface AuditItem { id: string; text: string; ts: Date; }

interface EvidenceItem { id: string; type: 'screenshot' | 'file' | 'url'; label: string; src?: string; }
interface PbSection { id: string; title: string; body: string; evidence: EvidenceItem[]; }

interface PbTest {
  id: string;
  process: string;
  scenario: string;
  priority: 'High' | 'Medium' | 'Low';
  risk: 'High' | 'Medium' | 'Low';
  source: string;
  status: 'Ready' | 'Draft' | 'Blocked';
}

interface CoverageCell {
  req: string;
  happy: 'full' | 'partial' | 'none';
  edge: 'full' | 'partial' | 'none';
  negative: 'full' | 'partial' | 'none';
}

interface ChangeRequest {
  id: string;
  title: string;
  impact: string;
  status: 'Proposed' | 'In Analysis' | 'Approved' | 'Rejected';
  source: string;
}

interface Insight {
  id: string;
  title: string;
  area: string;
  type: 'Optimization' | 'Consideration';
  status: 'Applied' | 'New';
}

interface EvidencePack {
  id: string;
  name: string;
  meta: string;
  date: string;
}

@Component({
  selector: 'app-post-build',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post-build.component.html',
  styleUrl: './post-build.component.scss'
})
export class PostBuildComponent {

  pbTestsTableHtml: string = `
  <table class="min-w-full text-sm border">
    <thead class="bg-gray-50">
      <tr>
        <th class="px-3 py-2 border">Process</th>
        <th class="px-3 py-2 border">Test Case</th>
        <th class="px-3 py-2 border">Type</th>
        <th class="px-3 py-2 border"><button class="px-2 py-1 border rounded text-xs">Move To Test</button></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="px-3 py-2 border">Journal Entry</td>
        <td class="px-3 py-2 border">Post reversal entry</td>
        <td class="px-3 py-2 border">Happy Path</td>
        <td class="px-3 py-2 border"><button class="px-2 py-1 border rounded text-xs">Move To Test</button></td>
      </tr>
      <tr>
        <td class="px-3 py-2 border">Journal Entry</td>
        <td class="px-3 py-2 border">Approval workflow</td>
        <td class="px-3 py-2 border">Edge Case</td>
        <td class="px-3 py-2 border"><button class="px-2 py-1 border rounded text-xs">Move To Test</button></td>
      </tr>
      <tr>
        <td class="px-3 py-2 border">Tax</td>
        <td class="px-3 py-2 border">VAT standardization</td>
        <td class="px-3 py-2 border">Negative</td>
        <td class="px-3 py-2 border"><button class="px-2 py-1 border rounded text-xs">Move To Test</button></td>
      </tr>
    </tbody>
  </table>
`;

  generatePbTests() {
    this.pbTests = [
      { id: 'T-001', process: 'Finance', scenario: 'JE approval >50k', priority: 'High', risk: 'High', source: '§2 Finance Setup', status: 'Ready' },
      { id: 'T-002', process: 'Tax', scenario: 'EU VAT code lookup', priority: 'Medium', risk: 'Medium', source: '§3 Tax', status: 'Ready' },
      { id: 'T-003', process: 'Integrations', scenario: 'SAC nightly job', priority: 'High', risk: 'High', source: '§4 Integrations', status: 'Draft' }
    ];
  }


  /* ========= Top Bar ========= */
  projects = ['ACME S/4 Finance Rollout', 'Payroll Integration'];
  selectedProject = this.projects[0];
  showAssistant = true;

  /* ========= Tabs ========= */
  tabs: Tab[] = ['overview', 'workspace', 'spec', 'editor', 'postbuild'];
  activeTab: Tab = 'overview';
  setTab(t: Tab) { this.activeTab = t; }
  isTab(t: Tab) { return this.activeTab === t; }

  toggleAssistant() { this.showAssistant = !this.showAssistant; }

  /* ========= Overview ========= */
  overviewKPIs: KPI[] = [
    { label: 'Phase', value: 'Kickoff' },
    { label: 'Spec Coverage', value: '32%' },
    { label: 'Workshops Scheduled', value: '5' },
    { label: 'Pending Decisions', value: '0' },
  ];

  checklist: ChecklistItem[] = [
    { t: 'Invite core team members', s: 'Assign roles: BA, Consultant, Tester, Sponsor', done: false },
    { t: 'Connect calendar & conferencing', s: 'Sync Teams/Zoom and auto-import meeting notes', done: false },
    { t: 'Verify modules & scope', s: 'Finance, Integrations (edit if needed)', done: false },
    { t: 'Confirm workshop plan', s: '3-week cadence autogenerated', done: false },
    { t: 'Share RFP/spec pack', s: 'Ensure stakeholders can access the docs', done: false },
  ];
  get checklistProgress(): string {
    const c = this.checklist.filter(x => x.done).length;
    return `${c}/${this.checklist.length} completed`;
  }
  toggleChecklist(i: number) { this.checklist[i].done = !this.checklist[i].done; }

  /* ========= Workspace ========= */
  wsHeld = 6;
  wsTotal = 10;
  decRes = 2;
  decTotal = 4;
  cov = 63;

  wsList = ['Finance 01', 'Finance 02', 'Finance 03', 'Integrations 01', 'Integrations 02'];

  get workspaceProgress(): number {
    const score = (this.wsHeld / this.wsTotal) * 0.5
      + (this.decRes / this.decTotal) * 0.25
      + (this.cov / 100) * 0.25;
    return Math.round(score * 100);
  }

  get signoffReady(): boolean {
    return this.wsHeld >= this.wsTotal && this.decRes >= this.decTotal && this.cov >= 80;
  }

  adjust(type: 'ws' | 'dec' | 'cov', delta: number) {
    if (type === 'ws') {
      this.wsHeld = Math.max(0, Math.min(this.wsTotal, this.wsHeld + delta));
    } else if (type === 'dec') {
      this.decRes = Math.max(0, Math.min(this.decTotal, this.decRes + delta));
    } else if (type === 'cov') {
      this.cov = Math.max(0, Math.min(100, this.cov + delta));
    }
  }

  /* ========= Spec (Interactive) ========= */
  feedItems: FeedItem[] = [
    { title: 'Process Definition Document Generated Successfully', detail: '13 detailed steps created + swimlane.' },
    { title: 'Primary Artifact', detail: 'Process Definition Document' },
    { title: 'Supporting Artifact', detail: 'Swimlane_Diagram' },
  ];
  newFeed = '';
  get feedCount(): number { return this.feedItems.length; }
  addFeed() {
    const v = (this.newFeed || '').trim();
    if (!v) return;
    this.feedItems.unshift({ title: 'User Prompt', detail: v });
    this.newFeed = '';
  }

  comments: CommentItem[] = [
    { id: 'c1', anchor: 'Objective', text: 'Clarify if cost allocation uses blended approach?', author: 'Ava', status: 'open', ts: new Date(Date.now() - 1000 * 60 * 12) },
    { id: 'c2', anchor: 'Primary Owners', text: 'Add Manufacturing Manager for refurb flow.', author: 'Raj', status: 'open', ts: new Date(Date.now() - 1000 * 60 * 5) },
  ];
  newComment = '';
  get openComments(): number { return this.comments.filter(c => c.status === 'open').length; }
  addComment() {
    const v = (this.newComment || '').trim();
    if (!v) return;
    this.comments.unshift({
      id: 'c' + Date.now(),
      anchor: 'Objective',
      text: v,
      author: 'You',
      status: 'open',
      ts: new Date(),
    });
    this.newComment = '';
  }
  resolveComment(c: CommentItem) { c.status = 'resolved'; }

  activeDoc: DocTab = 'document';
  setDoc(tab: DocTab) { this.activeDoc = tab; }
  docTitle = 'Inventory Management and Refurbishment Process Definition Document';
  docBody = 'Objective: Enable efficient processing of bulk inventory receipts with component breakdown and cost allocation, plus end-to-end refurbishment operations from as-is to finish.';

  processNodes: ProcessNode[] = [
    { label: 'Vendor Quotation Request', x: '1.5rem', y: '1.5rem' },
    { label: 'Create RFQ', x: '14rem', y: '1.5rem' },
    { label: 'Confirm Purchase Order', x: '28rem', y: '1.5rem' },
    { label: 'Receive Bulk Items', x: '1.5rem', y: '10rem' },
    { label: 'Identify Components', x: '14rem', y: '10rem' },
    { label: 'Validate Receipt', x: '28rem', y: '10rem' },
  ];

  /* ========= Editor (Collaborative) ========= */
  edTitle = 'Finance Specification';
  edBody = 'Objective: Configure JE posting with 2-step approval for > 50k; Standardize EU VAT codes.';

  edRows: EdRow[] = [
    { field: 'Company Codes', value: '1000, 1100', note: 'Confirmed in WS-03' },
    { field: 'JE Approval Threshold', value: '> 50,000', note: 'To be signed by CFO' },
    { field: 'Tax Codes Set', value: 'EU-VAT-2025', note: 'Harmonized' },
  ];

  edComments: EdComment[] = [
    { id: 'ec1', author: 'Ava (BA)', text: 'Clarify if > 50k is gross or net of tax?', status: 'open', anchor: 'JE Approval Threshold', ts: new Date() },
  ];
  edNewComment = '';

  addRowComment(row: EdRow) {
    this.edComments.unshift({
      id: 'ec' + Date.now(),
      author: 'You',
      text: `Comment on ${row.field}`,
      status: 'open',
      anchor: row.field,
      ts: new Date(),
    });
    this.addAudit(`Comment added on ${row.field}`);
  }

  addEdComment() {
    const v = (this.edNewComment || '').trim();
    if (!v) return;
    this.edComments.unshift({
      id: 'ec' + Date.now(),
      author: 'You',
      text: v,
      status: 'open',
      anchor: 'General',
      ts: new Date(),
    });
    this.edNewComment = '';
    this.addAudit('Comment added');
  }

  resolveEdComment(c: EdComment) {
    c.status = 'resolved';
    this.addAudit(`Comment ${c.id} resolved`);
  }

  versions: VersionItem[] = [
    { id: 'v1', label: 'v0.1 Draft', ts: new Date() },
  ];

  addVersion() {
    const next = this.versions.length + 1;
    const v: VersionItem = { id: 'v' + next, label: `v0.${next} Draft`, ts: new Date() };
    this.versions.unshift(v);
    this.addAudit('Version saved');
  }

  restoreVersion(v: VersionItem) {
    this.addAudit(`Restored ${v.id}`);
  }

  audit: AuditItem[] = [];
  addAudit(text: string) {
    this.audit.unshift({ id: 'a' + Date.now(), text, ts: new Date() });
  }

  applySuggest() {
    this.edBody = `${this.edBody} — AI refined wording for clarity.`;
    this.addAudit('Eerly applied auto-adjustments');
  }

  /* ========= Post-Build ========= */
  activePbTab: PbTab = 'spec';
  setPbTab(t: PbTab) { this.activePbTab = t; }
  isPbTab(t: PbTab) { return this.activePbTab === t; }

  pbMetrics = {
    build: 'Success · Aug 27, 2025 10:32',
    coverage: 82,
    spec: 94,
    opt: 6,
    ex: 0,
  };

  pbSections: PbSection[] = [
    {
      id: 'sec-exec',
      title: '1. Executive Summary',
      body: '2-step JE approval >50k (net), EU VAT set, nightly SAC feed.',
      evidence: [{ id: 'ev1', type: 'screenshot', label: 'Workflow config', src: 'https://placehold.co/600x360?text=Workflow' }],
    },
    {
      id: 'sec-fin',
      title: '2. Finance Setup',
      body: 'Company Codes 1000/1100 created; workflow active.',
      evidence: [{ id: 'ev2', type: 'screenshot', label: 'Company 1000', src: 'https://placehold.co/600x360?text=1000' }],
    },
    {
      id: 'sec-tax',
      title: '3. Tax (EU VAT)',
      body: '2025 set loaded; 57 codes validated.',
      evidence: [{ id: 'ev3', type: 'screenshot', label: 'VAT Codes', src: 'https://placehold.co/600x360?text=VAT' }],
    },
  ];

  onViewEvidence(sec: PbSection) {
    // In Angular, you’d open a dialog/lightbox here. For now, log it.
    console.log('Open evidence:', sec.evidence);
  }

  pbTests: PbTest[] = [
    { id: 'T-001', process: 'Finance', scenario: 'JE approval >50k', priority: 'High', risk: 'High', source: '§2 Finance Setup', status: 'Ready' },
    { id: 'T-002', process: 'Tax', scenario: 'EU VAT code lookup', priority: 'Medium', risk: 'Medium', source: '§3 Tax', status: 'Ready' },
    { id: 'T-003', process: 'Integrations', scenario: 'SAC nightly job', priority: 'High', risk: 'High', source: '§4 Integrations', status: 'Draft' },
  ];

  pbCoverageCells: CoverageCell[] = [
    { req: 'JE approval', happy: 'full', edge: 'full', negative: 'partial' },
    { req: 'VAT lookup', happy: 'full', edge: 'partial', negative: 'none' },
    { req: 'SAC feed', happy: 'full', edge: 'full', negative: 'partial' },
  ];

  get pbCoverageScore(): number { return this.pbMetrics.coverage; }
  pbGapsText = '2 requirements lack negative tests.';
  fixGaps() {
    // Stub: in real app, trigger AI generation and recalc coverage
    this.pbGapsText = 'Gap fixes proposed (draft).';
  }

  pbChanges: ChangeRequest[] = [
    { id: 'CR-101', title: 'Lower approval threshold to 40k', impact: 'Finance', status: 'Proposed', source: 'Ticket #5321' },
    { id: 'CR-102', title: 'Add negative test for JE reversal', impact: 'Finance', status: 'In Analysis', source: 'Spec comment' },
  ];

  pbInsights: Insight[] = [
    { id: 'I-01', title: 'Enable gzip on SAC feed', area: 'Integrations', type: 'Optimization', status: 'Applied' },
    { id: 'I-02', title: 'Retire 8 legacy VAT codes', area: 'Tax', type: 'Optimization', status: 'New' },
  ];

  pbEvQuery = '';
  pbEvidencePacks: EvidencePack[] = [
    { id: 'p1', name: 'Evidence Pack #1', meta: 'PRJ-2043 · v0.9 · SHA 6F3A7C12B9F0', date: 'Aug 27, 2025' },
    { id: 'p2', name: 'Evidence Pack #2', meta: 'PRJ-2043 · v0.9 · SHA 6F3A7C12B9F0', date: 'Aug 27, 2025' },
    { id: 'p3', name: 'Evidence Pack #3', meta: 'PRJ-2043 · v0.9 · SHA 6F3A7C12B9F0', date: 'Aug 27, 2025' },
    { id: 'p4', name: 'Evidence Pack #4', meta: 'PRJ-2043 · v0.9 · SHA 6F3A7C12B9F0', date: 'Aug 27, 2025' },
    { id: 'p5', name: 'Evidence Pack #5', meta: 'PRJ-2043 · v0.9 · SHA 6F3A7C12B9F0', date: 'Aug 27, 2025' },
    { id: 'p6', name: 'Evidence Pack #6', meta: 'PRJ-2043 · v0.9 · SHA 6F3A7C12B9F0', date: 'Aug 27, 2025' },
  ];

  get filteredEvidencePacks(): EvidencePack[] {
    const q = (this.pbEvQuery || '').toLowerCase();
    if (!q) return this.pbEvidencePacks;
    return this.pbEvidencePacks.filter(p => (p.name + ' ' + p.meta + ' ' + p.date).toLowerCase().includes(q));
  }

  /* ========= TrackBy helpers ========= */
  trackByIndex = (_: number, __: unknown) => _;
  trackById = (_: number, item: { id?: string }) => item?.id ?? _;
}
