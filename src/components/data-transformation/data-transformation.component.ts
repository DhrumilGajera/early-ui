// import { Component } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { Inject, PLATFORM_ID } from '@angular/core';

type Screen = 'DASH' | 'IMPORT' | 'MAPPER' | 'TABLE' | 'VALIDATE' | 'RUN' | 'EXPORTS' | 'HISTORY';

interface LegacyRow { VendorId: string; Name: string; Country: string; IBAN: string; }
interface Mapping {
  id: string;
  legacy: string;
  target: string;
  rule: string;
  decisionRef: string;
  valid: boolean;
  history?: any[];
}
interface Snapshot { id: string; label: string; ts: number; data: Mapping[]; }
interface Run {
  id: string;
  type: string;
  status: 'queued' | 'running' | 'done';
  progress: number;
  rowsOut: number;
  errors: any[];
  startedAt?: string | null;
  finishedAt?: string | null;
}

const BRAND = '#052c65';

function uid(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 9);
}
@Component({
  selector: 'app-data-transformation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-transformation.component.html',
  styleUrl: './data-transformation.component.scss'
})
export class DataTransformationComponent implements OnInit, AfterViewInit, OnDestroy {

  // layout / brand
  BRAND = BRAND;

  // screens
  screen: Screen = 'DASH';

  // sample artifacts
  legacyExtract: LegacyRow[] = [
    { VendorId: 'V001', Name: 'ACME GmbH', Country: 'DE', IBAN: '' },
    { VendorId: 'V002', Name: 'Globex Ltd', Country: 'UK', IBAN: 'GB12-XXXX' },
    { VendorId: 'V003', Name: 'Initech SA', Country: 'FR', IBAN: '' }
  ];
  targetTemplate: string[] = ['SupplierID', 'SupplierName', 'CountryCode', 'BankAccountIBAN'];

  // mappings
  mappings: Mapping[] = [
    { id: uid('m-'), legacy: 'VendorId', target: 'SupplierID', rule: 'copy', decisionRef: 'FIN-DEC-042', valid: true, history: [] },
    { id: uid('m-'), legacy: 'Name', target: 'SupplierName', rule: 'copy', decisionRef: 'FIN-DEC-042', valid: true, history: [] },
    { id: uid('m-'), legacy: 'Country', target: 'CountryCode', rule: 'uppercase', decisionRef: 'MDM-COUNTRY-STD', valid: true, history: [] },
    { id: uid('m-'), legacy: 'IBAN', target: 'BankAccountIBAN', rule: 'normalize_iban', decisionRef: 'FIN-CASH-IBAN', valid: true, history: [] }
  ];

  // snapshots / history
  snapshots: Snapshot[] = [];

  // runs
  runs: Run[] = [];
  private runTimer: any = null;

  // Visual mapper state
  links: Array<{ id: string; from: string; to: string }> = [];
  dragState: { type: 'legacy' | 'target'; field: string } | null = null;

  // lines for svg: computed positions
  lines: Array<{ id: string; x1: number; y1: number; x2: number; y2: number }> = [];

  // view refs
  @ViewChild('boardRef', { static: false }) boardRef!: ElementRef<HTMLElement>;

  // filters / UI
  filterForTable = '';
  importStep = 1;

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef, @Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      console.log(window.innerWidth); // safe to use
    }
  }

  ngOnInit(): void {
    // seed links from mappings
    this.links = this.mappings.map(m => ({ id: m.id, from: m.legacy, to: m.target }));
    // start run tick timer
    this.ngZone.runOutsideAngular(() => {
      this.runTimer = setInterval(() => {
        this.ngZone.run(() => this.tickRuns());
      }, 900);
    });
  }

  ngAfterViewInit(): void {
    // compute SVG lines when view is ready
    // setTimeout(() => this.updateLines(), 200);
    // window.addEventListener('resize', this.onWindowResize);
  }

  ngOnDestroy(): void {
    // if (this.runTimer) clearInterval(this.runTimer);
    // window.removeEventListener('resize', this.onWindowResize);
  }

  // private onWindowResize = () => this.updateLines();

  // ---------- Screen navigation ----------
  setScreen(s: Screen) { this.screen = s; setTimeout(() => this.updateLines(), 100); }

  // ---------- Runs engine ----------
  enqueueRun(type: string): string {
    const id = 'RUN-' + uid('').toUpperCase();
    const r: Run = { id, type, status: 'queued', progress: 0, rowsOut: 0, errors: [], startedAt: null, finishedAt: null };
    this.runs = [...this.runs, r];
    // start shortly
    setTimeout(() => { this.runs = this.runs.map(x => x.id === id ? { ...x, status: 'running', startedAt: new Date().toISOString() } : x); }, 250);
    return id;
  }

  private tickRuns() {
    this.runs = this.runs.map(r => {
      if (r.status !== 'running') return r;
      const next = Math.min(100, r.progress + Math.ceil(Math.random() * 15));
      const updated: Run = {
        ...r,
        progress: next,
        rowsOut: this.legacyExtract.length,
        finishedAt: next >= 100 ? new Date().toISOString() : r.finishedAt,
        status: next >= 100 ? 'done' : 'running' // now matches Run['status']
      };
      return updated;
    });
    this.cdr.markForCheck();
  }

  // ---------- Visual Mapper: drag & drop ----------
  onDragStartLegacy(field: string) {
    this.dragState = { type: 'legacy', field };
  }
  onDragOverTarget(e: DragEvent) {
    if (this.dragState && this.dragState.type === 'legacy') e.preventDefault();
  }
  onDropTarget(field: string) {
    if (!this.dragState) return;
    if (this.dragState.type === 'legacy') {
      this.linkFields(this.dragState.field, field);
    }
    this.dragState = null;
  }

  linkFields(fromField: string, toField: string) {
    // If existing mapping for legacy, update their target; else create new mapping
    const existing = this.mappings.find(m => m.legacy === fromField);
    if (existing) {
      this.addHistory(existing.id, { kind: 'change', field: 'target', from: existing.target, to: toField });
      existing.target = toField;
      existing.valid = !!(existing.legacy && existing.target);
      // update links
      this.links = this.links.map(l => l.id === existing.id ? { ...l, from: fromField, to: toField } : l);
    } else {
      const id = uid('m-');
      const row: Mapping = { id, legacy: fromField, target: toField, rule: 'copy', decisionRef: '', valid: !!(fromField && toField), history: [] };
      this.mappings = [row, ...this.mappings];
      this.links = [{ id, from: fromField, to: toField }, ...this.links];
    }
    setTimeout(() => this.updateLines(), 120);
  }

  removeLink(linkId: string) {
    this.links = this.links.filter(l => l.id !== linkId);
    this.mappings = this.mappings.filter(m => m.id !== linkId);
    setTimeout(() => this.updateLines(), 120);
  }

  // compute svg lines based on bounding boxes
  updateLines() {
    try {
      if (!this.boardRef) return;
      const rect = (this.boardRef.nativeElement.getBoundingClientRect && this.boardRef.nativeElement.getBoundingClientRect()) || { left: 0, top: 0 };
      const newLines: any[] = [];
      this.links.forEach(l => {
        const leftEl = this.boardRef.nativeElement.querySelector(`[data-left="${CSS.escape(l.from)}"]`) as HTMLElement;
        const rightEl = this.boardRef.nativeElement.querySelector(`[data-right="${CSS.escape(l.to)}"]`) as HTMLElement;
        if (!leftEl || !rightEl) return;
        const a = leftEl.getBoundingClientRect();
        const b = rightEl.getBoundingClientRect();
        newLines.push({
          id: l.id,
          x1: a.right - rect.left,
          y1: a.top + a.height / 2 - rect.top,
          x2: b.left - rect.left,
          y2: b.top + b.height / 2 - rect.top
        });
      });
      this.lines = newLines;
      this.cdr.markForCheck();
    } catch (err) {
      // fail silently
    }
  }

  // ---------- Mapping table helpers ----------
  get filteredMappings(): Mapping[] {
    const q = (this.filterForTable || '').toLowerCase();
    return this.mappings.filter(m => `${m.legacy} ${m.target} ${m.rule} ${m.decisionRef}`.toLowerCase().includes(q));
  }

  updateRow(id: string, key: keyof Mapping, val: any) {
    this.mappings = this.mappings.map(m => {
      if (m.id !== id) return m;
      const before = { legacy: m.legacy, target: m.target, rule: m.rule, decisionRef: m.decisionRef };
      const next = { ...m, [key]: val, valid: !!((key === 'target' ? val : m.target) && (key === 'legacy' ? val : m.legacy)) };
      const after = { legacy: next.legacy, target: next.target, rule: next.rule, decisionRef: next.decisionRef };
      const diffKey = (['legacy', 'target', 'rule', 'decisionRef'] as (keyof Mapping)[]).find(k => (before as any)[k] !== (after as any)[k]);
      if (diffKey) this.addHistory(id, { kind: 'change', field: diffKey, from: (before as any)[diffKey], to: (after as any)[diffKey] });
      return next;
    });
    setTimeout(() => this.updateLines(), 120);
  }

  showHistory(id: string) {
    const m = this.mappings.find(x => x.id === id);
    if (!m) {
      //  alert('Not found');
       return; }
    const lines = (m.history || []).map(h => `• ${new Date(h.ts).toLocaleString()} – ${h.field}: ${String(h.from || '—')} → ${String(h.to || '—')}`).join('\n');
    // alert(lines || 'No history yet.');
  }

  addHistory(mapId: string, entry: any) {
    this.mappings = this.mappings.map(m => m.id === mapId ? { ...m, history: [...(m.history || []), { ...entry, ts: Date.now() }] } : m);
  }

  // ---------- Snapshots ----------
  snapshotMappings() {
    const snap: Snapshot = { id: uid('snap-'), label: `Snapshot ${this.snapshots.length + 1}`, ts: Date.now(), data: JSON.parse(JSON.stringify(this.mappings)) };
    this.snapshots = [...this.snapshots, snap];
    // alert('Snapshot saved.');
  }
  restoreSnapshot(id: string) {
    const s = this.snapshots.find(x => x.id === id);
    if (!s) { 
      // alert('Snapshot not found');
       return; }
    this.mappings = JSON.parse(JSON.stringify(s.data));
    setTimeout(() => this.updateLines(), 100);
    // alert('Snapshot restored.');
  }

  // ---------- Sync decisions ----------
  syncDecisions() {
    this.mappings = this.mappings.map(m => {
      if (m.decisionRef === 'FIN-CASH-IBAN') return { ...m, rule: 'normalize_iban' };
      if (m.decisionRef === 'MDM-COUNTRY-STD') return { ...m, rule: 'map_country' };
      return m;
    });
    // alert('Decisions synced.');
    setTimeout(() => this.updateLines(), 100);
  }

  // ---------- Validate preview ----------
  runValidate() {
    this.enqueueRun('validate');
    // no heavy logic; preview will be available in VALIDATE screen
    setTimeout(() => this.setScreen('VALIDATE'), 300);
  }

  // ---------- Exports ----------
  get completedExports() {
    return this.runs.filter(r => r.status === 'done').map(r => ({ id: r.id, when: r.finishedAt, rows: r.rowsOut, type: r.type }));
  }

  // ---------- Utilities ----------
  trackByMapping(_: number, item: Mapping) { return item.id; }
  trackByRun(_: number, item: Run) { return item.id; }

  // helpers for template (KPIs)
  get kpiTotals() {
    const totalRuns = this.runs.length;
    const last = totalRuns ? this.runs[this.runs.length - 1] : null;
    return { legacyRows: this.legacyExtract.length, targetCols: this.targetTemplate.length, mappings: this.mappings.length, lastRunStatus: last ? last.status : '—', decisions: new Set(this.mappings.map(m => m.decisionRef)).size };
  }

  // compute lines periodically if things changed
  forceUpdateLinesLater() {
    setTimeout(() => this.updateLines(), 120);
  }

  get validMappingsCount(): number {
    return this.mappings?.filter(m => m.valid).length || 0;
  }

  showAlert(msg: string) {
    // alert(msg);
  }

  get noHistory(): boolean {
    return !this.mappings?.some(m => (m.history?.length || 0) > 0);
  }
}
