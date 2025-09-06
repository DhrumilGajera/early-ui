import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ChatWidgetComponent } from '../components/chat-widget/chat-widget.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,CommonModule,ChatWidgetComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
   constructor(private router: Router) {}

  goTo(path: string) {
    this.router.navigate([`/${path}`]);
  }

  isActive(path: string): boolean {
    // 'true' as the second argument makes it check exact route match
    return this.router.isActive(`/${path}`, { paths: 'exact', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored' });
  }
}
