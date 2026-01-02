import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // <--- IMPORTANTE: Necesitamos esto para traducir la respuesta

// Mantenemos la interfaz para que tu chat no se rompa
interface GeminiResponse {
  candidates: { content: { parts: { text: string }[] } }[];
}

@Injectable({ providedIn: 'root' })
export class GeminiService {
  
  
  private url = 'https://vegai-backend.onrender.com/chat';
  // --- TU LÓGICA DE VEGAI (INTACTA) ---
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

  // 2. CAMBIO IMPORTANTE: Enviamos todo el texto a Python
  generateWithHistory(): Observable<GeminiResponse> {
    // Construimos el "cerebro" (Prompt + Historia)
    const promptCompleto = this.buildFullPrompt();

    // Enviamos a Python un objeto JSON: { "message": "...todo el texto..." }
    return this.http.post<any>(this.url, { message: promptCompleto }).pipe(
      // 3. CAMBIO IMPORTANTE: Traducimos la respuesta de Python al formato que espera Angular
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