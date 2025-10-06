// src/app/chat/chat.component.ts
import {
  Component,
  AfterViewChecked,
  ElementRef,
  ViewChild,
  OnInit,
} from '@angular/core';
import { CommonModule, NgForOf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SimpleMarkdownPipe } from '../../shared/pipes/markdown.pipe';
import { GeminiService } from '../../services/gemini.service';

interface Message {
  from: 'user' | 'ia';
  text: string;
  timestamp?: Date;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    NgForOf,
    NgClass,
    FormsModule,
    CardModule,
    ScrollPanelModule,
    InputTextModule,
    ButtonModule,
    ProgressSpinnerModule,
    SimpleMarkdownPipe,
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('scroll', { read: ElementRef }) scrollPanel?: ElementRef;

  messages: Message[] = [];
  userInput = '';
  loading = false;
  private shouldScroll = false;

  private readonly WELCOME_KEY = 'vegaai_seen_welcome';

  private readonly WELCOME_TEXT = `¡Hola! 😊 Soy VegaAI, tu asistente virtual para Ciencias de la Computación y Digitalización.
Estoy aquí para ayudarte a descubrir lo fascinante que es la tecnología, la programación y todo el mundo digital.
¿Sobre qué tema te gustaría aprender hoy? 💻✨`;

  // Bandera para saber si ya se reprodujo el TTS del saludo inicial
  private welcomeSpoken = false;

  constructor(private gemini: GeminiService) {}

ngOnInit(): void {
  const seen = localStorage.getItem(this.WELCOME_KEY);
  
  // Siempre mostrar el saludo en la interfaz
  this.messages.push({ from: 'ia', text: this.WELCOME_TEXT, timestamp: new Date() });

  if (!seen) {
    // Primera vez → marcar en el historial y reproducir voz
    this.gemini.registerWelcomeShown();
    this.speakWelcome();
    localStorage.setItem(this.WELCOME_KEY, '1');
  } else {
    // Ya se mostró antes → solo marcar scroll, sin repetir TTS ni API
    this.shouldScroll = true;
  }
}

private speakWelcome(): void {
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(this.WELCOME_TEXT);
      u.lang = 'es-ES';
      window.speechSynthesis.speak(u);
      this.welcomeSpoken = true;
    }
  } catch (e) {
    console.warn('SpeechSynthesis error', e);
  }
}

  private sendAndHandle(userText: string, opts: { showUserMessage: boolean } = { showUserMessage: true }): void {
    if (opts.showUserMessage) {
      this.messages.push({ from: 'user', text: userText, timestamp: new Date() });
    }

    this.gemini.addUserMessageToHistory(userText);

    if (opts.showUserMessage) this.userInput = '';
    this.loading = true;
    this.shouldScroll = true;

    this.gemini.generateWithHistory().subscribe({
      next: (resp) => {
        const reply = resp?.candidates?.[0]?.content?.parts?.[0]?.text
          || 'No se recibió respuesta válida.';

        this.messages.push({ from: 'ia', text: reply, timestamp: new Date() });
        this.gemini.addAiMessageToHistory(reply);

        this.loading = false;
        this.shouldScroll = true;

        // TTS: reproducir salvo que sea una repetición del saludo inicial
        try {
          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            // Si ya sonó el saludo inicial y la respuesta parece ser un saludo, no repetir TTS
            if (this.welcomeSpoken && this.isReplyGreeting(reply)) {
              // no reproducir
            } else {
              const u = new SpeechSynthesisUtterance(reply);
              u.lang = 'es-ES';
              window.speechSynthesis.speak(u);
            }
          }
        } catch (e) {
          console.warn('SpeechSynthesis error', e);
        }
      },
      error: (err) => {
        console.error('Error en Gemini:', err);
        const errMsg = `Error: ${err?.message ?? 'desconocido'}`;
        this.messages.push({ from: 'ia', text: errMsg, timestamp: new Date() });
        this.gemini.addAiMessageToHistory(errMsg);
        this.loading = false;
        this.shouldScroll = true;
      },
    });
  }

  /** Detección sencilla de replies que son saludos/repeticiones del welcome.
   *  Puedes ajustar la regex si tu modelo usa otras palabras.
   */
  private isReplyGreeting(reply: string): boolean {
    if (!reply) return false;
    const r = reply.toLowerCase();
    // patrones comunes: empieza con "hola", contiene "soy vegaai" o "tu asistente virtual"
    return (
      r.trim().startsWith('¡hola') ||
      r.trim().startsWith('hola') ||
      r.includes('soy vegaai') ||
      r.includes('tu asistente virtual') ||
      /¿sobre qué tema te gustaría|estoy aquí para ayudarte/.test(r)
    );
  }

  send(): void {
    const text = this.userInput.trim();
    if (!text) return;
    this.sendAndHandle(text, { showUserMessage: true });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.scrollPanel?.nativeElement) {
      const hostEl: HTMLElement = this.scrollPanel.nativeElement;
      const inner = hostEl.querySelector('.p-scrollpanel-content') as HTMLElement | null;
      if (inner) {
        inner.scrollTop = inner.scrollHeight;
      }
      this.shouldScroll = false;
    }
  }

newConversation(): void {
  this.messages = [];
  this.gemini.resetConversation();
  localStorage.removeItem(this.WELCOME_KEY);
  this.welcomeSpoken = false;

  // Mostrar saludo en la UI
  this.messages.push({ from: 'ia', text: this.WELCOME_TEXT, timestamp: new Date() });

  // Volver a marcar y reproducir voz
  this.gemini.registerWelcomeShown();
  this.speakWelcome();

  localStorage.setItem(this.WELCOME_KEY, '1');
}

}
