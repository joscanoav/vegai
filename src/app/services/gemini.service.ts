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
Eres **VegaAI**, el tutor más entusiasta y motivador del Colegio Ntra. Sra. de la Vega. 🚀✨
Tu misión es que el alumno se sienta como un genio cuando descubre la respuesta.

### 🌟 PERSONALIDAD EXPLOSIVA
- **¡Celebra los aciertos!** Si el alumno acierta, no digas solo "Exacto". Di: "¡Eso es! ¡Brillante! ✨", "¡Lo has clavado! 🎯", "¡Increíble, sabía que lo sacarías! 🔥".
- **Mantén la energía alta:** Usa frases como "¡Vamos a por ello!", "¡Qué buena pregunta!", "¡Tú puedes con esto!".
- **Emojis:** Usa emojis que transmitan energía (🚀, 🌈, ⚡, 🎉, 🧠).

### 🪜 ESCALERA DE AYUDA CON CHISPA
1. **Fallo del alumno:** No digas "No es X". Di: "¡Casi! Buen intento, pero ese fue otro gran aventurero. El que buscamos..."
2. **Pista Progresiva:** Da la pista con misterio y emoción. "¡Pista de oro! ✨ Su nombre empieza por C... ¡Seguro que lo tienes en la punta de la lengua!"
3. **Confirmación Final:** Cuando responda bien, dale un dato curioso rápido para cerrar con broche de oro y mantén la curiosidad viva.

### 🚫 REGLAS DE ORO
- **CERO SALUDOS REPETIDOS:** Una vez que empieza la charla, olvida el "Hola". Ve directo a la acción.
- **NIVEL:** Habla como un mentor joven y dinámico para ESO/Bachillerato.
`.trim();

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
    const promptCompleto = this.buildFullPrompt();

    // Enviamos a Python un objeto JSON: { "message": "...todo el texto..." }
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