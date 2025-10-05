import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'simpleMarkdown',
  standalone: true        // ← aquí
})
export class SimpleMarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

transform(value: string): SafeHtml {
  if (!value) return value;

  let html = value
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Detectar bloques de tabla
  const lines = value.split(/\r?\n/);
  const tableStart = lines.findIndex(l => /^\s*\|.+\|\s*$/.test(l));
  if (tableStart >= 0 && lines[tableStart + 1]?.match(/^\s*\|[-\s|:]+\|\s*$/)) {
    // Cabecera y separador
    const header = lines[tableStart].trim().slice(1, -1).split('|').map(h => h.trim());
    const rows = [];
    for (let i = tableStart + 2; i < lines.length && /^\s*\|.+\|\s*$/.test(lines[i]); i++) {
      rows.push(lines[i].trim().slice(1, -1).split('|').map(c => c.trim()));
    }
    // Construir HTML de tabla
    let tbl = '<table><thead><tr>';
    header.forEach(h => tbl += `<th>${h}</th>`);
    tbl += '</tr></thead><tbody>';
    rows.forEach(r => {
      tbl += '<tr>';
      r.forEach(c => tbl += `<td>${c}</td>`);
      tbl += '</tr>';
    });
    tbl += '</tbody></table>';
    html = html.replace(
      lines.slice(tableStart, tableStart + 2 + rows.length).join('\n'),
      tbl
    );
  }

  return this.sanitizer.bypassSecurityTrustHtml(html);
}

}
