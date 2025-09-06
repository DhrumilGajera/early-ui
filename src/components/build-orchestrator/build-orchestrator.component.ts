import { Component } from '@angular/core';
import { SignoffBuildComponent } from '../signoff-build/signoff-build.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-build-orchestrator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './build-orchestrator.component.html',
  styleUrl: './build-orchestrator.component.scss'
})
export class BuildOrchestratorComponent extends SignoffBuildComponent {

}
