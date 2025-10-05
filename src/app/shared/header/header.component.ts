// Componente de cabecera que incluye toolbar y botón de tema
import { Component, ViewEncapsulation } from '@angular/core'; // Decorador y control de encapsulación de estilos
import { ToolbarModule } from 'primeng/toolbar';            // Módulo de toolbar de PrimeNG
import { ButtonModule } from 'primeng/button';              // Módulo de botones de PrimeNG
import { RippleModule } from 'primeng/ripple';              // Módulo para efecto ripple en botones

@Component({
  selector: 'app-header',            // Selector para usar el componente en templates
  standalone: true,                  // Componente independiente, no necesita NgModule
  imports: [                         // Módulos de PrimeNG que utiliza este componente
    ToolbarModule,
    ButtonModule,
    RippleModule
  ],
  templateUrl: './header.component.html', // Archivo de plantilla HTML
  styleUrls: ['./header.component.css'],  // Archivo de estilos CSS
  encapsulation: ViewEncapsulation.None   // Deshabilita encapsulación para poder aplicar estilos globales
})
export class HeaderComponent {
  // Bandera que indica el modo oscuro (true) o claro (false)
  darkMode = false;

  /**
   * Alterna el tema de la aplicación entre claro y oscuro.
   * - Invierte el valor de darkMode
   * - Añade/quita la clase 'dark' en el <body> para cambiar estilos globales
   */
  toggleTheme() {
    this.darkMode = !this.darkMode;                   // Cambia el estado de darkMode
    document.body.classList.toggle('dark', this.darkMode); // Aplica o remueve clase en el body
  }
}
