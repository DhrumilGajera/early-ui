import { Injectable, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class ProjectStore {
  brand = '#052c65';
  project = signal({ id:'PRJ-2043', name:'ACME S/4 Finance Rollout', owner:'Jane Smith', region:'EMEA' });
  activeTab = signal<'overview'|'workspace'|'spec'|'editor'>('overview');
  metrics = signal([{label:'Build Status',value:'Success · Aug 27, 2025 10:32'},{label:'Coverage Score',value:'82%',sub:'Mapped & ready'},{label:'Spec Completeness',value:'94%',sub:'With evidence'},{label:'Optimizations',value:'6'},{label:'Open Exceptions',value:'0'}]);
  tasks = signal([{id:'T1',area:'Finance',title:'Create Company Codes 1000,1100',assignee:'Lina',status:'done'},
                  {id:'T2',area:'Finance',title:'Configure JE approval (2-step >50k)',assignee:'Raj',status:'in-progress'}]);
  activities = signal([{id:'A1', text:'Spec v0.9 published', at: new Date().toISOString()}]);
  chat = signal([{id:'C1', role:'assistant', content:'I can extract scope, draft the spec, and schedule workshops.', at: new Date().toISOString()}]);
  setTab(t:any){ this.activeTab.set(t); }
}
