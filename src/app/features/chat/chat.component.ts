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

private readonly WELCOME_TEXT = `¡Hola, explorador! 👋 Soy **VegAI**, tu tutor personal del Colegio Nuestra Señora de la Vega. 📚✨

Estoy aquí para acompañarte en tu aprendizaje: desde **Matemáticas** 🧮 e **Inglés**, hasta **Literatura** 📖, **Biología** 🧬 o **Geografía e Historia** 🌍.

¡Yo te doy las pistas y tú pones la magia! 🎩✨ **¿Qué desafío tenemos hoy?**`;

  private welcomeSpoken = false;
  isSpeaking = false;

  constructor(private gemini: GeminiService) {}

  ngOnInit(): void {
    const seen = localStorage.getItem(this.WELCOME_KEY);

    // Mostramos siempre el mensaje de bienvenida visualmente
    this.messages.push({ from: 'ia', text: this.WELCOME_TEXT, timestamp: new Date() });

    // IMPORTANTE: Registramos en el servicio que el saludo ya se mostró 
    // para que la IA no lo repita en su primera respuesta real.
    this.gemini.registerWelcomeShown();

    if (!seen) {
      this.speakWelcome();
      localStorage.setItem(this.WELCOME_KEY, '1');
    } else {
      this.shouldScroll = true;
    }
  }

  private speakWelcome(): void {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        // Quitamos el Markdown para que el narrador no lea los asteriscos
        const plainText = this.WELCOME_TEXT.replace(/\*\*/g, '');
        const u = new SpeechSynthesisUtterance(plainText);
        u.lang = 'es-ES';

        this.isSpeaking = true;
        u.onend = () => (this.isSpeaking = false);
        u.onerror = () => (this.isSpeaking = false);

        window.speechSynthesis.speak(u);
        this.welcomeSpoken = true;
      }
    } catch (e) {
      console.warn('SpeechSynthesis error', e);
      this.isSpeaking = false;
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
          || '¡Vaya! Algo se ha desconectado. ¿Podemos intentarlo de nuevo? 😅';

        this.messages.push({ from: 'ia', text: reply, timestamp: new Date() });
        this.gemini.addAiMessageToHistory(reply);

        this.loading = false;
        this.shouldScroll = true;

        // TTS (Voz)
        try {
          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            // No repetir el audio si es un saludo que ya se dio
            if (this.welcomeSpoken && this.isReplyGreeting(reply)) {
               // Silencio
            } else {
              const u = new SpeechSynthesisUtterance(reply);
              u.lang = 'es-ES';
              this.isSpeaking = true;
              u.onend = () => (this.isSpeaking = false);
              u.onerror = () => (this.isSpeaking = false);
              window.speechSynthesis.speak(u);
            }
          }
        } catch (e) {
          this.isSpeaking = false;
        }
      },
      error: (err) => {
        console.error('🔴 ERROR:', err);
        const errMsg = `Lo siento, he tenido un pequeño problema técnico. 🛠️ ¿Podrías repetirme tu duda?`;
        this.messages.push({ from: 'ia', text: errMsg, timestamp: new Date() });
        this.loading = false;
        this.shouldScroll = true;
      },
    });
  }

  // Lógica mejorada para detectar si la IA está repitiendo el saludo
  private isReplyGreeting(reply: string): boolean {
    if (!reply) return false;
    const r = reply.toLowerCase();
    return (
      r.trim().startsWith('¡hola') ||
      r.trim().startsWith('hola') ||
      r.includes('soy vegaai') ||
      r.includes('tutor personal') ||
      r.includes('colegio nuestra señora') ||
      /¿sobre qué tema|¿qué desafío escolar/.test(r)
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

    this.messages.push({ from: 'ia', text: this.WELCOME_TEXT, timestamp: new Date() });
    this.gemini.registerWelcomeShown();
    this.speakWelcome();
    localStorage.setItem(this.WELCOME_KEY, '1');
  }

  stopSpeech(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
    }
  }
}
