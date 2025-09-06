import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { log } from 'console';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.scss'
})
export class ChatWidgetComponent {
  isOpen = false;
  userMessage = '';

  // Panel position
  position = { x: 1185, y: 265 };
  private dragging = false;
  private dragOffset = { x: 0, y: 0 };

  // Panel size
  size = { width: 320, height: 384 };
  private resizing = false;
  private resizeStart = { x: 0, y: 0 };
  private initialSize = { width: 320, height: 384 };

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  sendMessage() {
    if (!this.userMessage.trim()) return;
    console.log('Send message:', this.userMessage);
    this.userMessage = '';
  }

  // Start dragging
  startDrag(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    const e = event instanceof TouchEvent ? event.touches[0] : event;
    this.dragging = true;
    this.dragOffset.x = e.clientX - this.position.x;
    this.dragOffset.y = e.clientY - this.position.y;
  }

  // Start resizing
  startResize(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    event.stopPropagation();
    const e = event instanceof TouchEvent ? event.touches[0] : event;
    this.resizing = true;
    this.resizeStart.x = e.clientX;
    this.resizeStart.y = e.clientY;
    this.initialSize.width = this.size.width;
    this.initialSize.height = this.size.height;
  }

  // Handle mouse/touch move globally
  @HostListener('window:mousemove', ['$event'])
  @HostListener('window:touchmove', ['$event'])
  onMove(event: MouseEvent | TouchEvent) {
    const e = event instanceof TouchEvent ? event.touches[0] : event;

    // Drag
    if (this.dragging) {
      this.position.x = e.clientX - this.dragOffset.x;
      this.position.y = e.clientY - this.dragOffset.y;
    }

    // Resize
    if (this.resizing) {
      this.size.width = Math.max(200, this.initialSize.width + (e.clientX - this.resizeStart.x));
      this.size.height = Math.max(200, this.initialSize.height + (e.clientY - this.resizeStart.y));
    }
    console.log(this.position);
    
  }

  @HostListener('window:mouseup')
  @HostListener('window:touchend')
  stopActions() {
    this.dragging = false;
    this.resizing = false;
  } ght = this.size.height;

}
