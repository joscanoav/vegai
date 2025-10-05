// Importa el tipo Routes para definir rutas de la aplicación
import { Routes } from '@angular/router';
// Importa el componente de chat que se mostrará en la ruta '/chat'
import { ChatComponent } from './features/chat/chat.component';

// Definición del array de rutas de la aplicación
export const routes: Routes = [  
  // Ruta raíz que redirige automáticamente a 'chat' con coincidencia exacta
  { path: '', redirectTo: 'chat', pathMatch: 'full' },
  // Ruta '/chat' que renderiza ChatComponent
  { path: 'chat', component: ChatComponent },
  // Ruta comodín que redirige cualquier otra ruta a 'chat'
  { path: '**', redirectTo: 'chat' }
];
