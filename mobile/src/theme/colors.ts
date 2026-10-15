// Paleta por defecto. Los componentes no la importan directamente: leen la paleta
// activa desde `display.colors` (ver roleDisplay.ts), que cambia con el modo de alto contraste.
export const colors = {
  azul: '#2F5E5F',
  azulOscuro: '#1F4243',
  azulClaro: '#E4EEEC',
  terracota: '#E07A5F',
  amarillo: '#F2B94B',
  verde: '#8EAF8B',
  verdeSuave: '#ECF2E9',
  crema: '#FFF7ED',
  grisTexto: '#4A4A4A',
  grisMedio: '#6B6B6B',
  line: '#E7DCC9',
  blanco: '#FFFFFF',
  error: '#B3261E',
  errorOscuro: '#8C1D18',
  errorClaro: '#FBE9E7',
  mapa: '#EAF1E4',
  mapaLinea: '#D3E0CA',
  mapaAgua: '#D3E6EC',
  scrim: 'rgba(20, 30, 30, 0.55)',
}

export type Palette = { [K in keyof typeof colors]: string }

// Alto contraste: fondo blanco, texto casi negro y bordes marcados. Cumple 7:1 (AAA)
// en texto sobre fondo y en los botones principales.
export const highContrastColors: Palette = {
  azul: '#00383B',
  azulOscuro: '#001A1C',
  azulClaro: '#D6EBE8',
  terracota: '#9C2F14',
  amarillo: '#FFD21F',
  verde: '#1B5E20',
  verdeSuave: '#DCEFDA',
  crema: '#FFFFFF',
  grisTexto: '#0F0F0F',
  grisMedio: '#333333',
  line: '#1A1A1A',
  blanco: '#FFFFFF',
  error: '#8A0000',
  errorOscuro: '#5C0000',
  errorClaro: '#FFE3E0',
  mapa: '#F2F2F2',
  mapaLinea: '#9A9A9A',
  mapaAgua: '#CFE6F0',
  scrim: 'rgba(0, 0, 0, 0.7)',
}
