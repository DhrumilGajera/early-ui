import { Injectable, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class ExistingCustomerStore {
  brand = '#052c65'; screen = signal<'HOME'|'CONNECT'|'DISCOVER'|'INVENTORY'|'SPEC'|'TICKETS'|'SYNC'>('HOME');
  project = signal({ projectId: 'PRJ-2043', projectName: 'ACME S/4 Finance Rollout' });
  landscape = signal({ env: 'PRD', systemId: 'S4P-PRD' });
  baseline = signal({ versionId:'baseline-2025-08-27', versionHash:'AB12CD34EF56', signed:false });
  connection = signal({ status:'idle', message:'' }); discovery = signal<{at:string,text:string}[]>([]);
  inventory = signal([{id:'I-001',type:'Config',name:'Company Codes 1000/1100',area:'Finance',status:'ok'}]);
  tickets = signal([{ id:'INC-5401', title:'JE approval threshold mismatch', area:'Finance', status:'open' }]);
  setScreen(s:any){ this.screen.set(s); }
  connect(){ this.connection.set({status:'connecting', message:'Establishing read-only connection…'}); this.discovery.set([]);
    let steps = ['RFC ping successful','OData catalog read','Authorizations validated','Read-only scope confirmed','Connection established']; let i=0;
    import('timers').then(() => {}); 
  }
  publishBaseline(){ const payload = { versionId:'baseline-v1', versionHash:'B4SE1INE9SHA' }; this.baseline.set({ ...payload, signed:true }); this.setScreen('SYNC'); }
  updateTicket(id:string, status:any){ this.tickets.update(l=>l.map(t=>t.id===id?{...t,status}:t)); }
}
