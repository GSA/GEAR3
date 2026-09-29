import {
  AfterViewChecked,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';

import {
  ChatbotService,
  ChatMessage,
} from '@services/chatbot/chatbot.service';

@Component({
  selector: 'gear-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css'],
  standalone: false,
})
export class ChatbotComponent implements AfterViewChecked {
  public open = false;
  public inputText = '';
  public loading = false;
  public messages: ChatMessage[] = [];

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef;

  constructor(private chatbotService: ChatbotService) {}

  toggle(): void {
    this.open = !this.open;
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  send(): void {
    const text = this.inputText.trim();
    if (!text || this.loading) {
      return;
    }

    // Snapshot history (prior turns) before adding the new user message.
    const history = this.messages.slice();

    this.messages.push({ role: 'user', content: text });
    this.inputText = '';
    this.loading = true;

    this.chatbotService.sendMessage(text, history).subscribe((res) => {
      this.messages.push({
        role: 'assistant',
        content: res?.reply || 'No response.',
      });
      this.loading = false;
    });
  }

  clear(): void {
    this.messages = [];
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop =
          this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch (_) {
      /* no-op */
    }
  }
}
