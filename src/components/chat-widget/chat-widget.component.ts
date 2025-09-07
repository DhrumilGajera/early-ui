import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.scss'
})
export class ChatWidgetComponent {
  isOpen = false;
  userMessage = '';

  // Panel position & size (px)
  position = { x: 1185, y: 265 };
  size = { width: 320, height: 384 };

  // state flags
  private dragging = false;
  private dragOffset = { x: 0, y: 0 };

  private resizing = false;
  private resizeStart = { x: 0, y: 0 };
  private initialSize = { width: 320, height: 384 };

  // fullscreen
  fullScreen = false;
  private prevPosition = { x: 0, y: 0 };
  private prevSize = { width: 320, height: 384 };

  // responsive behaviour: open full screen on small screens
  private readonly MOBILE_BREAKPOINT = 768;

  // toggle chat visibility
  toggleChat() {
    // if opening and small screen => open fullscreen for better UX
    if (!this.isOpen) {
      if (window.innerWidth < this.MOBILE_BREAKPOINT) {
        this.enterFullScreenForOpen();
      }
    }
    this.isOpen = !this.isOpen;
    // if closing, also reset dragging/resizing state
    if (!this.isOpen) {
      this.dragging = false;
      this.resizing = false;
    }
  }

  // Send (demo)
  sendMessage() {
    if (!this.userMessage || !this.userMessage.trim()) return;
    console.log('Send message:', this.userMessage);
    // push to chat log (not implemented)...
    this.userMessage = '';
  }

  // Dragging
  startDrag(event: MouseEvent | TouchEvent) {
    // don't allow dragging while fullscreen
    if (this.fullScreen) return;

    event.preventDefault();
    const e = event instanceof TouchEvent ? event.touches[0] : (event as MouseEvent);

    this.dragging = true;
    this.dragOffset.x = e.clientX - this.position.x;
    this.dragOffset.y = e.clientY - this.position.y;
  }

  // Resizing
  startResize(event: MouseEvent | TouchEvent) {
    if (this.fullScreen) return;

    event.preventDefault();
    event.stopPropagation();
    const e = event instanceof TouchEvent ? event.touches[0] : (event as MouseEvent);

    this.resizing = true;
    this.resizeStart.x = e.clientX;
    this.resizeStart.y = e.clientY;
    this.initialSize.width = this.size.width;
    this.initialSize.height = this.size.height;
  }

  // Global pointer move
  @HostListener('window:mousemove', ['$event'])
  @HostListener('window:touchmove', ['$event'])
  onMove(event: MouseEvent | TouchEvent) {
    const e = event instanceof TouchEvent ? event.touches[0] : (event as MouseEvent);

    // Dragging
    if (this.dragging) {
      const newX = e.clientX - this.dragOffset.x;
      const newY = e.clientY - this.dragOffset.y;

      // bounds: keep inside the viewport
      const maxX = Math.max(0, window.innerWidth - this.size.width);
      const maxY = Math.max(0, window.innerHeight - this.size.height);

      this.position.x = Math.min(Math.max(0, newX), maxX);
      this.position.y = Math.min(Math.max(0, newY), maxY);
    }

    // Resizing
    if (this.resizing) {
      const deltaX = e.clientX - this.resizeStart.x;
      const deltaY = e.clientY - this.resizeStart.y;

      const newW = Math.max(240, this.initialSize.width + deltaX);
      const newH = Math.max(200, this.initialSize.height + deltaY);

      // don't exceed viewport
      this.size.width = Math.min(newW, window.innerWidth - 16);
      this.size.height = Math.min(newH, window.innerHeight - 16);
    }
  }

  // Stop drag/resize
  @HostListener('window:mouseup')
  @HostListener('window:touchend')
  stopActions() {
    this.dragging = false;
    this.resizing = false;
  }

  // Panel style helper used by template
  getPanelStyle() {
    if (this.fullScreen) {
      // when fullscreen let CSS classes inset-0 handle it
      return {
        // nothing required here
      };
    }

    return {
      top: `${this.position.y}px`,
      left: `${this.position.x}px`,
      width: `${this.size.width}px`,
      height: `${this.size.height}px`,
      // small min constraints for safety
      'min-width': '240px',
      'min-height': '200px',
      'max-width': `${window.innerWidth - 16}px`,
      'max-height': `${window.innerHeight - 16}px`
    } as any;
  }

  // Toggle fullscreen (preserve/restore previous size & position)
  toggleFullScreen(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    if (!this.fullScreen) {
      // save current state
      this.prevPosition = { ...this.position };
      this.prevSize = { ...this.size };

      this.fullScreen = true;
      // set to cover whole viewport
      this.position = { x: 0, y: 0 };
      this.size = { width: window.innerWidth, height: window.innerHeight };
    } else {
      // restore
      this.fullScreen = false;
      this.position = { ...this.prevPosition };
      this.size = { ...this.prevSize };
    }
  }

  // Helper: when opening on small screens
  private enterFullScreenForOpen() {
    this.prevPosition = { ...this.position };
    this.prevSize = { ...this.size };
    this.fullScreen = true;
    this.position = { x: 0, y: 0 };
    this.size = { width: window.innerWidth, height: window.innerHeight };
  }

  // Update size while in fullscreen if window resizes
  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    if (this.fullScreen) {
      this.size = { width: window.innerWidth, height: window.innerHeight };
      this.position = { x: 0, y: 0 };
    } else {
      // keep position inside bounds if viewport shrinks
      const maxX = Math.max(0, window.innerWidth - this.size.width);
      const maxY = Math.max(0, window.innerHeight - this.size.height);
      this.position.x = Math.min(Math.max(0, this.position.x), maxX);
      this.position.y = Math.min(Math.max(0, this.position.y), maxY);
    }
  }

  // Escape closes fullscreen (if open) or closes widget (optional)
  @HostListener('window:keydown.escape', ['$event'])
  onEscape() {
    if (this.fullScreen) {
      this.toggleFullScreen();
      return;
    }
    if (this.isOpen) {
      this.toggleChat();
    }
  }
}
