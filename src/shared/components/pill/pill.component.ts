import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-pill',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pill.component.html',
  styleUrl: './pill.component.scss'
})
export class PillComponent {
@Input() tone: 'gray'|'green'|'amber'|'red'|'blue'|'brand' = 'gray';
  get toneClass(){
    switch(this.tone){
      case 'green': return 'bg-green-100 text-green-700';
      case 'amber': return 'bg-amber-100 text-amber-700';
      case 'red':   return 'bg-red-100 text-red-700';
      case 'blue':  return 'bg-blue-100 text-blue-700';
      case 'brand': return 'bg-[var(--brand)]/10 text-[var(--brand)]';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}
