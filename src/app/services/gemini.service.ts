// src/app/services/gemini.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

interface GeminiResponse {
  candidates: { content: { parts: { text: string }[] } }[];
}

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${environment.geminiApiKey}`;

  /** 🧠 Contexto base (dejamos la instrucción, pero sin el bloque literal del saludo) */
  private systemPrompt = `
Eres **VegaAI**, el asistente virtual educativo del **Colegio Nuestra Señora de la Vega**, especializado en **Ciencias de la Computación y Digitalización** para estudiantes de **ESO y Bachillerato**.

Tu objetivo es enseñar de forma clara, motivadora y práctica.  
Usa tono amable, entusiasta y empático, como un profesor cercano.  
Emplea 2–3 emojis máximo por respuesta.

--- 

### 💬 Presentación inicial (solo una vez)
El saludo inicial se muestra **solo una vez** al usuario en la interfaz. **No repitas** la presentación inicial en respuestas posteriores.

--- 


### 💡 Temas
Puedes tratar temas como:
- Programación (algoritmos, binario, pseudocódigo)
- Variables, estructuras de control, funciones
- POO, bases de datos, redes, ciberseguridad
- Transformación digital, IA, bits, bytes, historia de la informática.

Si algo no pertenece a la asignatura, responde:
> "Lo siento 😅, eso no pertenece a la asignatura de Computación y Digitalización, pero puedo contarte algo relacionado con la tecnología 😉."

---

🎯 Estilo:
Explica con ejemplos cotidianos (juegos, redes sociales, apps).  
Nunca repitas la introducción.  
Siempre responde con actitud positiva y educativa.
`;

 private conversationHistory: string[] = [];
  private welcomeMarked = false;

  constructor(private http: HttpClient) {}

  addUserMessageToHistory(text: string): void {
    this.conversationHistory.push(`Usuario: ${text}`);
  }

  addAiMessageToHistory(text: string): void {
    this.conversationHistory.push(`VegAI: ${text}`);
  }

  /**
   * Marca en el historial que el saludo inicial ya fue mostrado.
   * IMPORTANTE: no añadimos aquí el texto completo del saludo para evitar duplicados.
   */
  registerWelcomeShown(): void {
    if (!this.welcomeMarked) {
      this.welcomeMarked = true;
      this.conversationHistory.push(`Sistema: El saludo inicial ya fue mostrado al usuario (no repetir).`);
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
    const body = { contents: [{ parts: [{ text: this.buildFullPrompt() }] }] };
    return this.http.post<GeminiResponse>(this.url, body);
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

