import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; 

interface GeminiResponse {
  candidates: { content: { parts: { text: string }[] } }[];
}

@Injectable({ providedIn: 'root' })
export class GeminiService {
  
  
  private url = 'https://vegai-backend.onrender.com/chat';

private systemPrompt = `
Eres **VegaAI**, el tutor más entusiasta y motivador del Colegio Ntra. Sra. de la Vega para ESO y Bachillerato. 🚀✨

### 🚨 LÓGICA DE FLUJO (IMPORTANTE)
1. **Detección de Intención:** - Si el estudiante hace una pregunta directa (ej: "¿Quién conquistó...?", "¿Cómo se hace...?"), ignora el saludo inicial y pasa DIRECTAMENTE a la **Escalera de Ayuda**.
   - Solo responde con "¿Qué asignatura tienes en mente?" si el estudiante solo dice "Hola" o algo sin ningún contexto.
2. **Historial:** Revisa siempre los mensajes anteriores. Si el estudiante ya mencionó un tema (ej: "Historia"), no vuelvas a preguntar qué asignatura quiere ver.

### 🪜 ESCALERA DE AYUDA SOCRÁTICA
- **Fase 1 (Pista sutil):** No des el nombre. Da un detalle del origen o una característica. 
  *Ejemplo Incas:* "Fue un explorador extremeño que lideró la expedición hacia el sur desde Panamá... ¿Te suena su apellido?"
- **Fase 2 (Pista clave):** "Su apellido empieza por P y tuvo un socio llamado Diego de Almagro. ¡Seguro que lo sabes!"
- **Fase 3 (Confirmación):** ¡Exacto, Francisco Pizarro! ✨

### 🎭 PERSONALIDAD
- ¡Entusiasmo al máximo! 🚀
- CERO saludos repetidos. Si ya estás hablando, no digas "¡Hola!" otra vez.
- Usa 🇬🇧 para inglés y 🌍 para historia.
`.trim();


  private conversationHistory: string[] = [];
  private welcomeMarked = false;

  constructor(private http: HttpClient) {}

  addUserMessageToHistory(text: string): void {
    // Cambiamos "Usuario" por "Estudiante" para reforzar el rol pedagógico
    this.conversationHistory.push(`Estudiante: ${text}`);
  }

  addAiMessageToHistory(text: string): void {
    this.conversationHistory.push(`VegaAI: ${text}`);
  }

  registerWelcomeShown(): void {
    if (!this.welcomeMarked) {
      this.welcomeMarked = true;
      // Añadimos una instrucción de sistema clara para el historial
      this.conversationHistory.push(`Sistema: El estudiante ya ha visto la bienvenida. Espera a su duda para actuar como tutor socrático.`);
    }
  }

  private buildFullPrompt(): string {
    return `
${this.systemPrompt}

Historial de conversación:
${this.conversationHistory.join('\n')}
    `.trim();
  }

  generateWithHistory(): Observable<GeminiResponse> {
    const promptCompleto = this.buildFullPrompt();

    return this.http.post<any>(this.url, { message: promptCompleto }).pipe(
      map(response => {
        return {
          candidates: [
            { 
              content: { 
                parts: [{ text: response.reply }] 
              } 
            }
          ]
        };
      })
    );
  }

  generate(userText: string): Observable<GeminiResponse> {
    this.addUserMessageToHistory(userText);
    return this.generateWithHistory();
  }

  resetConversation(): void {
    this.conversationHistory = [];
    this.welcomeMarked = false;
  }

  getConversationHistory(): string[] {
    return [...this.conversationHistory];
  }
}