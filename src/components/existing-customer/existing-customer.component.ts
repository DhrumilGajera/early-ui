// import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExistingCustomerStore } from '../../shared/service/existing-customer.store';
import { Component, AfterViewInit, OnDestroy, NgZone } from '@angular/core';

@Component({
  selector: 'app-existing-customer',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './existing-customer.component.html',
  styleUrl: './existing-customer.component.scss'
})
export class ExistingCustomerComponent {
  // Stepper
  SCREENS = ["HOME","DISCOVER","CONNECT","INVENTORY","SPEC","TICKETS","SYNC"];
  labels = ["Home","Discovery","Connect","Inventory & Gaps","Baseline Spec","Ticket Sync","Ongoing Sync"];
  currentScreen = 'HOME';

  // HOME checklist
  homeList = [
    { t:"Connect SAP", done:false },
    { t:"Select scope", done:false },
    { t:"Run discovery", done:false },
    { t:"Generate baseline spec", done:false },
    { t:"Enable ticket sync", done:false }
  ];

  // Connect wizard
  cwStep = 1;

  // Discovery
  discRunning = false;
  discPct = 0;
  discEvents: string[] = [];
  private discTimer: any = null;

  // Inventory
  gapOnly = true;
  incTrans = false;
  invModules = [
    { key:"Finance", coverage:78, items:["Company Codes (2)","JE Workflow","Tolerance Groups"], gaps:["Missing negative tests for JE reversal"] },
    { key:"Tax", coverage:64, items:["EU VAT set (57)","Legacy codes archived"], gaps:["Edge cases for intra-EU sales"] },
    { key:"Integrations", coverage:81, items:["Nightly SAC feed (02:00)","Compression enabled"], gaps:["Retry policy evidence"] }
  ];

  // Spec builder
  specSections: Array<{id:string, title:string, body:string, evidence:string[], accepted:boolean}> = [
    { id:"s1", title:"Finance Setup", body:"Company Codes 1000/1100 configured; JE approval >50k (net).", evidence:["Screenshot: JE workflow","Transport: TR12345"], accepted:false },
    { id:"s2", title:"Tax (EU VAT)", body:"EU VAT 2025 set (57 codes) loaded; legacy codes archived.", evidence:["Screenshot: VAT codes"], accepted:false },
    { id:"s3", title:"Integrations (SAC)", body:"Nightly feed 02:00 UTC; delta partitioning enabled.", evidence:["Screenshot: Job schedule"], accepted:false }
  ];

  // Tickets
  tkConnected = false;
  tkStatus = 'Not connected';

  // Sync
  syncFreq = 'Nightly';
  syncTime = '02:30';
  runs = [
    { when:"Aug 27, 2025 03:01", result:"No drift", changes:0 },
    { when:"Aug 26, 2025 02:59", result:"Minor drift", changes:3 }
  ];
  syncSignals = [
    "JE workflow step changed in CoCd 1100 (pending confirmation)",
    "New VAT code introduced (mapping missing)"
  ];

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    // no DOM string injection here — template + bindings handle everything
  }

  ngOnDestroy(): void {
    if (this.discTimer) { clearInterval(this.discTimer); this.discTimer = null; }
  }

  /* ===== Stepper / Navigation ===== */
  switchTo(id: string) {
    this.currentScreen = id;
    // keep wizard step reset when entering CONNECT
    if (id === 'CONNECT') this.cwStep = 1;
  }

  /* ===== HOME checklist ===== */
  toggleHome(idx: number) {
    this.homeList[idx].done = !this.homeList[idx].done;
  }

  /* ===== CONNECT wizard ===== */
  cwPrev() { this.cwStep = Math.max(1, this.cwStep - 1); }
  cwNext() { this.cwStep = Math.min(3, this.cwStep + 1); }
  cwConnect() {
    this.switchTo('DISCOVER');
    this.startDiscovery();
  }

  /* ===== DISCOVERY ===== */
  startDiscovery() {
    if (this.discRunning) return;
    this.discRunning = true;
    this.discPct = 0;
    this.discEvents = [];
    this.discEvents.push("Connected via RFC & OData");

    this.discTimer = setInterval(() => {
      // ensure updates are inside Angular zone
      this.ngZone.run(() => {
        this.discPct = Math.min(100, this.discPct + 10);

        if (this.discPct === 30) this.discEvents.push("Read customizing tables (FIN, INT)");
        if (this.discPct === 50) this.discEvents.push("Detected 2 company codes, 57 VAT codes");
        if (this.discPct === 70) this.discEvents.push("Found nightly integration job (SAC)");
        if (this.discPct === 90) this.discEvents.push("Transport history normalized");
        if (this.discPct === 100) {
          if (this.discTimer) { clearInterval(this.discTimer); this.discTimer = null; }
          this.discRunning = false;
          this.discEvents.push("Discovery complete");
        }
      });
    }, 500);
  }

  discReset() {
    if (this.discTimer) { clearInterval(this.discTimer); this.discTimer = null; }
    this.discRunning = false;
    this.discPct = 0;
    this.discEvents = [];
  }

  get discComplete(): boolean { return this.discPct === 100; }

  /* ===== INVENTORY ===== */
  createSection(key: string) {
    const exists = this.specSections.find(s => s.title === key);
    if (!exists) {
      const id = 's' + (this.specSections.length + 1);
      this.specSections.push({ id, title: key, body: `${key} configured as detected.`, evidence: [], accepted: false });
    }
    this.switchTo('SPEC');
  }

  /* ===== SPEC ===== */
  get allSpecAccepted(): boolean {
    return this.specSections.every(s => s.accepted);
  }

  specPublish() {
    if (!this.allSpecAccepted) return;
    const token = { projectId:"PRJ-2043", projectName:"ACME S/4 Finance Rollout", versionId:"baseline-v1", versionHash:"B4SE1INE9SHA" };
    try { localStorage.setItem('eerly_open_post_build', JSON.stringify(token)); } catch (e) {}
    alert("Baseline published. Handoff token saved. Open Integrated Workspace to continue.");
    this.switchTo('SYNC');
  }

  /* ===== TICKETS ===== */
  tkConnect() {
    this.tkConnected = true;
    this.tkStatus = "Connected to Jira cloud org globex.atlassian.net";
  }
  tkImport() {
    alert("Imported last 50 tickets (stub)");
  }

  /* ===== SYNC ===== */
  openWorkspace() {
    try { localStorage.setItem('eerly_open_post_build', JSON.stringify({ projectId:"PRJ-2043", projectName:"ACME S/4 Finance Rollout", versionId:"baseline-v1", versionHash:"B4SE1INE9SHA" })); } catch(e) {}
    alert("Workspace handoff set. Open Integrated Workspace (with Post-Build).");
  }
}
