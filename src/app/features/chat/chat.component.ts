// Importaciones de Angular y módulos necesarios
import {
  Component,            // Decorador para definir componentes
  AfterViewChecked,     // Ciclo de vida para acciones tras la detección de cambios en la vista
  ElementRef,           // Referencia a elementos del DOM
  ViewChild             // Decorador para obtener referencias a elementos dentro de la plantilla
} from '@angular/core';
import { CommonModule, NgForOf, NgClass } from '@angular/common'; // Módulos estructurales y de directivas
import { FormsModule } from '@angular/forms';                   // Soporte para formularios y ngModel
import { CardModule } from 'primeng/card';                       // Componente de tarjeta de PrimeNG
import { ScrollPanelModule } from 'primeng/scrollpanel';         // Panel con scroll de PrimeNG
import { InputTextModule } from 'primeng/inputtext';             // Campo de texto de PrimeNG
import { ButtonModule } from 'primeng/button';                   // Botón de PrimeNG
import { ProgressSpinnerModule } from 'primeng/progressspinner'; // Spinner de carga de PrimeNG
import { SimpleMarkdownPipe } from '../../shared/pipes/markdown.pipe'; // Pipe para renderizar Markdown simple
import { GeminiService } from '../../services/gemini.service';    // Servicio para comunicarse con la API Gemini

// Definición de la estructura de un mensaje
interface Message {
  from: 'user' | 'ia';   // Origen del mensaje: usuario o IA
  text: string;          // Contenido del mensaje
  timestamp?: Date;      // Marca de tiempo opcional
}

@Component({
  selector: 'app-chat',                // Selector del componente en templates
  standalone: true,                    // Componente independiente (sin módulo NgModule)
  imports: [                           // Módulos y pipes que importa este componente
    CommonModule,
    NgForOf,
    NgClass,
    FormsModule,
    CardModule,
    ScrollPanelModule,
    InputTextModule,
    ButtonModule,
    ProgressSpinnerModule,
    SimpleMarkdownPipe
  ],
  templateUrl: './chat.component.html', // Archivo de plantilla HTML
  styleUrls: ['./chat.component.css']    // Archivo de estilos CSS
})
export class ChatComponent implements AfterViewChecked {
  // Referencia al ScrollPanel para controlar el scroll automáticamente
  @ViewChild('scroll') scrollPanel!: ElementRef;

  messages: Message[] = [];  // Array que almacena los mensajes del chat
  userInput = '';            // Modelo vinculado al campo de entrada de usuario
  loading = false;           // Estado de carga para mostrar spinner
  private shouldScroll = false; // Indicador para desplazar al final tras nuevos mensajes

  constructor(private gemini: GeminiService) {} // Inyección del servicio Gemini

  // Método que se invoca al enviar un mensaje
  send(): void {
    const text = this.userInput.trim(); // Eliminar espacios al inicio y fin
    if (!text) return;                  // No enviar si el texto está vacío

    // Añade el mensaje del usuario al array con timestamp actual
    this.messages.push({ from: 'user', text, timestamp: new Date() });
    this.userInput = '';    // Limpia el campo de entrada
    this.loading = true;    // Activa el spinner de carga
    this.shouldScroll = true; // Marcar para hacer scroll al final

    // Llamada al servicio Gemini para generar respuesta
    this.gemini.generate(text).subscribe({
      next: resp => {
        // Extrae el texto de la primera respuesta válida o mensaje de error
        const reply =
          resp.candidates?.[0]?.content.parts[0].text ||
          'No se recibió respuesta válida.';
        // Añade la respuesta de la IA al chat
        this.messages.push({ from: 'ia', text: reply, timestamp: new Date() });
        this.loading = false;    // Desactiva el spinner
        this.shouldScroll = true; // Marcar para scroll
      },
      error: err => {
        // En caso de error, mostrar mensaje de error en el chat
        this.messages.push({
          from: 'ia',
          text: `Error: ${err.message}`,
          timestamp: new Date()
        });
        this.loading = false;    // Desactiva el spinner
        this.shouldScroll = true; // Marcar para scroll
      }
    });
  }

  // Ciclo de vida que se ejecuta tras cada detección de cambios en la vista
  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.scrollPanel) {
      // Obtiene el contenedor interno del ScrollPanel
      const el: HTMLElement = this.scrollPanel.nativeElement.querySelector(
        '.p-scrollpanel-content'
      );
      // Desplaza el scroll hasta el final para ver el último mensaje
      el.scrollTop = el.scrollHeight;
      this.shouldScroll = false; // Reset del indicador
    }
  }
}
