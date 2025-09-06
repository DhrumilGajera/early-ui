import { Component, signal, computed, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
interface Metric {
  label: string;
  value: string | number;
  sub: string;
}

interface Project {
  name: string;
  status: string;
  updated: string;
}
@Component({
  selector: 'app-new-project',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './new-project.component.html',
  styleUrl: './new-project.component.scss'
})

export class NewProjectComponent {
  // Dashboard data
  metrics: Metric[] = [
    { label: "Active Projects", value: 8, sub: "+2 this week" },
    { label: "In Testing", value: 5, sub: "23 test cases due" },
    { label: "Data Migration", value: "72%", sub: "Delta −4% vs plan" },
    { label: "Risks (Open)", value: 3, sub: "2 critical" },
  ];

  projects: Project[] = [
    { name: "S/4HANA Public Cloud – Finance (ME)", status: "In Build", updated: "2h ago" },
    { name: "SuccessFactors Core HR – Retail", status: "In Testing", updated: "1d ago" },
    { name: "Payroll Integration – ECP ↔ S/4", status: "In Build", updated: "3d ago" },
    { name: "Learning – Rollout Phase 2", status: "Go-Live Ready", updated: "5d ago" },
  ];

  activity: string[] = [
    "Updated Spec: Finance · 2h ago",
    "Generated Test Suite: Payroll Posting · 1d ago",
    "Data mapping saved for Employee Central · 2d ago",
    "Risk added: SSO latency · 3d ago"
  ];

  // Filters
  projSearch: string = '';
  statusFilter: string = 'all';

  // Modal + Wizard State
  modalOpen: boolean = false;
  step: number = 1;
  stepsTotal: number = 4;

  state = {
    name: '',
    industry: 'General',
    modules: [] as string[],
    template: 's4hana-public-finance-rapid',
    includeTesting: true,
    includeData: true,
    uploadedFile: null as File | null
  };

  moduleOptions: string[] = [
    "Finance", "Procurement", "Sales", "Manufacturing",
    "Employee Central", "Employee Central Payroll",
    "Time Management", "Learning"
  ];

  get filteredProjects(): Project[] {
    return this.projects.filter(p => {
      const okText = !this.projSearch || p.name.toLowerCase().includes(this.projSearch.toLowerCase());
      const okStatus = this.statusFilter === 'all' || p.status === this.statusFilter;
      return okText && okStatus;
    });
  }

  statusChip(status: string): string {
    if (status === "In Build") return "bg-amber-50 text-amber-700 border-amber-200";
    if (status === "In Testing") return "bg-blue-50 text-blue-700 border-blue-200";
    if (status === "Go-Live Ready") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  }

  openModal(): void {
    this.resetState();
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  resetState(): void {
    this.step = 1;
    this.state = {
      name: '',
      industry: 'General',
      modules: [],
      template: 's4hana-public-finance-rapid',
      includeTesting: true,
      includeData: true,
      uploadedFile: null
    };
  }

  setStep(n: number): void {
    if (n >= 1 && n <= this.stepsTotal) {
      this.step = n;
    }
  }

  canNext(): boolean {
    if (this.step === 1) return this.state.name.trim().length >= 3;
    if (this.step === 2) return this.state.modules.length > 0;
    return true;
  }

  next(): void {
    if (this.canNext() && this.step < this.stepsTotal) {
      this.step++;
    }
  }

  back(): void {
    if (this.step > 1) {
      this.step--;
    }
  }

  toggleModule(m: string): void {
    const idx = this.state.modules.indexOf(m);
    if (idx > -1) this.state.modules.splice(idx, 1);
    else this.state.modules.push(m);
  }

  tplLabel(value: string): string {
    const map: any = {
      "s4hana-public-finance-rapid": "S/4HANA Public Cloud (Finance) – Rapid Start",
      "successfactors-core": "SuccessFactors Core HR – Standard",
      "greenfield-hybrid": "Greenfield Hybrid – Guided"
    };
    return map[value] || value;
  }

  createProject(): void {
    const payload = {
      name: this.state.name,
      industry: this.state.industry,
      modules: [...this.state.modules],
      template: this.state.template,
      capabilities: {
        testing_automation: this.state.includeTesting,
        data_transformation: this.state.includeData
      }
    };
    alert('Project created:\n' + JSON.stringify(payload, null, 2));
    this.closeModal();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.state.uploadedFile = file;
      // Optionally add validation for type/size here
    }
  }

  newModule: string = '';

  addModule() {
    if (this.newModule.trim() && !this.state.modules.includes(this.newModule.trim())) {
      this.state.modules.push(this.newModule.trim());
      this.newModule = '';
    }
  }

  removeModule(module: string) {
    this.state.modules = this.state.modules.filter(m => m !== module);
  }
}
