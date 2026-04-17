/**
 * Componentes de interfaz reutilizables.
 *
 * Cada componente UI se coloca en su propia carpeta dentro de este directorio,
 * siguiendo la convención:
 *
 *   src/components/ui/<NombreComponente>/
 *     ├── <NombreComponente>.tsx    ← Implementación del componente
 *     └── index.ts                  ← Re-exportación para importaciones limpias
 *
 * Ejemplo de importación:
 *   import { Boton } from '@/components/ui/Boton'
 *
 * Directrices de semántica HTML:
 *   - Usa etiquetas HTML semánticas siempre que sea posible (<button>, <nav>, <main>, etc.)
 *   - Cada componente interactivo debe incluir atributos ARIA apropiados
 *   - Evita usar <div> como contenedor genérico cuando existe una etiqueta más específica
 */
