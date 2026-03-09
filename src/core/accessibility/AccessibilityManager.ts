/**
 * AccessibilityManager - Sistema de gestión de accesibilidad
 * Incluye: navegación por teclado, contraste, lectores de pantalla, WCAG compliance
 */

export enum AccessibilityFeature {
  KEYBOARD_NAVIGATION = 'keyboard_navigation',
  HIGH_CONTRAST = 'high_contrast',
  REDUCED_MOTION = 'reduced_motion',
  SCREEN_READER = 'screen_reader',
  LARGE_TEXT = 'large_text',
  COLOR_BLIND = 'color_blind'
}

export interface AccessibilityConfig {
  features: Set<AccessibilityFeature>;
  fontSize: number; // porcentaje (100 = normal)
  contrastRatio: number; // mínimo 4.5:1 para WCAG AA
  keyboardShortcuts: Map<string, () => void>;
  focusTraps: Set<string>; // IDs de elementos que atrapan focus
}

export interface AccessibilityViolation {
  element: HTMLElement;
  violation: string;
  severity: 'error' | 'warning' | 'info';
  wcagCriteria: string[];
  suggestion: string;
}

export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private config: AccessibilityConfig = {
    features: new Set(),
    fontSize: 100,
    contrastRatio: 4.5,
    keyboardShortcuts: new Map(),
    focusTraps: new Set()
  };
  private violations: AccessibilityViolation[] = [];
  private isInitialized = false;
  private focusHistory: HTMLElement[] = [];
  private maxFocusHistory = 10;

  private constructor() {
    // Detectar preferencias del sistema
    this.detectSystemPreferences();
  }

  public static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  // ===== INICIALIZACIÓN =====
  
  public initialize(): void {
    if (this.isInitialized) return;
    
    console.log('[Accessibility] 🦮 Inicializando gestor de accesibilidad');
    
    // Configurar listeners
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupReducedMotion();
    
    // Aplicar configuración inicial
    this.applyConfig();
    
    this.isInitialized = true;
    console.log('[Accessibility] ✅ Gestor de accesibilidad inicializado');
  }

  private detectSystemPreferences(): void {
    // Detectar prefers-reduced-motion
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotionQuery.matches) {
      this.config.features.add(AccessibilityFeature.REDUCED_MOTION);
    }
    
    // Detectar prefers-contrast
    const highContrastQuery = window.matchMedia('(prefers-contrast: more)');
    if (highContrastQuery.matches) {
      this.config.features.add(AccessibilityFeature.HIGH_CONTRAST);
    }
    
    // Escuchar cambios
    reducedMotionQuery.addEventListener('change', (e) => {
      if (e.matches) {
        this.config.features.add(AccessibilityFeature.REDUCED_MOTION);
      } else {
        this.config.features.delete(AccessibilityFeature.REDUCED_MOTION);
      }
      this.applyConfig();
    });
    
    highContrastQuery.addEventListener('change', (e) => {
      if (e.matches) {
        this.config.features.add(AccessibilityFeature.HIGH_CONTRAST);
      } else {
        this.config.features.delete(AccessibilityFeature.HIGH_CONTRAST);
      }
      this.applyConfig();
    });
  }

  // ===== CONFIGURACIÓN =====
  
  public enableFeature(feature: AccessibilityFeature): void {
    this.config.features.add(feature);
    this.applyConfig();
    console.log(`[Accessibility] ✅ Habilitado: ${feature}`);
  }

  public disableFeature(feature: AccessibilityFeature): void {
    this.config.features.delete(feature);
    this.applyConfig();
    console.log(`[Accessibility] ❌ Deshabilitado: ${feature}`);
  }

  public isFeatureEnabled(feature: AccessibilityFeature): boolean {
    return this.config.features.has(feature);
  }

  public setFontSize(percentage: number): void {
    this.config.fontSize = Math.max(80, Math.min(200, percentage)); // Limitar entre 80% y 200%
    this.applyConfig();
    console.log(`[Accessibility] 📝 Tamaño de fuente: ${percentage}%`);
  }

  public setContrastRatio(ratio: number): void {
    this.config.contrastRatio = Math.max(3, Math.min(7, ratio)); // Limitar entre 3:1 y 7:1
    this.applyConfig();
    console.log(`[Accessibility] 🎨 Ratio de contraste: ${ratio}:1`);
  }

  public registerKeyboardShortcut(key: string, action: () => void): void {
    this.config.keyboardShortcuts.set(key.toLowerCase(), action);
    console.log(`[Accessibility] ⌨️  Atajo registrado: ${key}`);
  }

  public unregisterKeyboardShortcut(key: string): void {
    this.config.keyboardShortcuts.delete(key.toLowerCase());
  }

  private applyConfig(): void {
    const root = document.documentElement;
    
    // Aplicar tamaño de fuente
    root.style.fontSize = `${this.config.fontSize}%`;
    
    // Aplicar alto contraste
    if (this.isFeatureEnabled(AccessibilityFeature.HIGH_CONTRAST)) {
      root.classList.add('high-contrast');
      root.setAttribute('data-contrast', 'high');
    } else {
      root.classList.remove('high-contrast');
      root.removeAttribute('data-contrast');
    }
    
    // Aplicar movimiento reducido
    if (this.isFeatureEnabled(AccessibilityFeature.REDUCED_MOTION)) {
      root.classList.add('reduced-motion');
      root.setAttribute('data-motion', 'reduced');
    } else {
      root.classList.remove('reduced-motion');
      root.removeAttribute('data-motion');
    }
    
    // Aplicar modo para daltonismo
    if (this.isFeatureEnabled(AccessibilityFeature.COLOR_BLIND)) {
      root.classList.add('color-blind-friendly');
      root.setAttribute('data-color-blind', 'enabled');
    } else {
      root.classList.remove('color-blind-friendly');
      root.removeAttribute('data-color-blind');
    }
    
    // Aplicar texto grande
    if (this.isFeatureEnabled(AccessibilityFeature.LARGE_TEXT)) {
      root.classList.add('large-text');
      root.setAttribute('data-text-size', 'large');
    } else {
      root.classList.remove('large-text');
      root.removeAttribute('data-text-size');
    }
  }

  // ===== NAVEGACIÓN POR TECLADO =====
  
  private setupKeyboardNavigation(): void {
    document.addEventListener('keydown', (event) => {
      // Atajos globales
      const key = event.key.toLowerCase();
      
      // Skip si está en input, textarea o contenteditable
      const target = event.target as HTMLElement;
      if (this.isEditableElement(target)) {
        return;
      }
      
      // Ejecutar atajo registrado
      const action = this.config.keyboardShortcuts.get(key);
      if (action) {
        event.preventDefault();
        event.stopPropagation();
        action();
        return;
      }
      
      // Navegación por teclado estándar
      switch (event.key) {
        case 'Tab':
          this.handleTabNavigation(event);
          break;
          
        case 'Escape':
          this.handleEscapeKey();
          break;
          
        case 'Enter':
        case ' ':
          this.handleActionKey(event);
          break;
          
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          this.handleArrowKeys(event);
          break;
          
        case 'Home':
          this.focusFirstElement();
          break;
          
        case 'End':
          this.focusLastElement();
          break;
      }
    });
  }

  private isEditableElement(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    const isInput = tagName === 'input' && (element as HTMLInputElement).type !== 'button';
    const isTextarea = tagName === 'textarea';
    const isContentEditable = element.getAttribute('contenteditable') === 'true';
    
    return isInput || isTextarea || isContentEditable;
  }

  private handleTabNavigation(event: KeyboardEvent): void {
    // Guardar historial de focus
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      this.focusHistory.push(activeElement);
      if (this.focusHistory.length > this.maxFocusHistory) {
        this.focusHistory.shift();
      }
    }
    
    // Manejar focus traps
    if (this.isInFocusTrap(activeElement)) {
      event.preventDefault();
      this.focusNextInTrap(activeElement);
    }
  }

  private handleEscapeKey(): void {
    // Cerrar modales, dropdowns, etc.
    const modals = document.querySelectorAll('[role="dialog"], [data-modal]');
    modals.forEach(modal => {
      if (modal.hasAttribute('open')) {
        (modal as HTMLElement).click();
      }
    });
    
    // Volver al elemento anterior
    if (this.focusHistory.length > 0) {
      const previousElement = this.focusHistory.pop();
      previousElement?.focus();
    }
  }

  private handleActionKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    
    // Activar elementos clickeables con Enter/Space
    if (target.hasAttribute('role') || target.tagName === 'BUTTON' || target.tagName === 'A') {
      event.preventDefault();
      target.click();
    }
  }

  private handleArrowKeys(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    
    // Navegación en listas, menús, etc.
    if (target.hasAttribute('role') && ['listbox', 'menu', 'tree', 'tablist'].includes(target.getAttribute('role')!)) {
      event.preventDefault();
      this.navigateInList(target, event.key);
    }
  }

  private navigateInList(container: HTMLElement, direction: string): void {
    const items = Array.from(container.querySelectorAll('[role="option"], [role="menuitem"], [role="treeitem"], [role="tab"]'));
    const currentIndex = items.findIndex(item => item === document.activeElement);
    
    if (currentIndex === -1) return;
    
    let nextIndex = currentIndex;
    
    switch (direction) {
      case 'ArrowUp':
      case 'ArrowLeft':
        nextIndex = Math.max(0, currentIndex - 1);
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        nextIndex = Math.min(items.length - 1, currentIndex + 1);
        break;
    }
    
    (items[nextIndex] as HTMLElement).focus();
  }

  private focusFirstElement(): void {
    const focusable = this.getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }

  private focusLastElement(): void {
    const focusable = this.getFocusableElements();
    if (focusable.length > 0) {
      focusable[focusable.length - 1].focus();
    }
  }

  private getFocusableElements(): HTMLElement[] {
    return Array.from(document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(el => {
      const element = el as HTMLElement;
      return !element.hasAttribute('disabled') && 
             element.offsetParent !== null && // Visible
             element.getAttribute('aria-hidden') !== 'true';
    }) as HTMLElement[];
  }

  // ===== GESTIÓN DE FOCUS =====
  
  private setupFocusManagement(): void {
    // Track focus changes
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      this.announceFocus(target);
    });
    
    // Estilos para focus visible
    document.addEventListener('mousedown', () => {
      document.body.classList.add('using-mouse');
    });
    
    document.addEventListener('keydown', () => {
      document.body.classList.remove('using-mouse');
    });
  }

  private announceFocus(element: HTMLElement): void {
    // Para lectores de pantalla
    const label = element.getAttribute('aria-label') || 
                  element.textContent?.trim() || 
                  element.getAttribute('title');
    
    if (label && this.isFeatureEnabled(AccessibilityFeature.SCREEN_READER)) {
      this.speak(label);
    }
  }

  private speak(text: string): void {
    // Implementación básica para lectores de pantalla
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Cancelar speech anterior
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  // ===== MOVIMIENTO REDUCIDO =====
  
  private setupReducedMotion(): void {
    if (this.isFeatureEnabled(AccessibilityFeature.REDUCED_MOTION)) {
      // Deshabilitar animaciones CSS
      const style = document.createElement('style');
      style.id = 'reduced-motion-styles';
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // ===== VALIDACIÓN WCAG =====
  
  public auditPage(): AccessibilityViolation[] {
    this.violations = [];
    
    // 1. Verificar contraste de color
    this.checkColorContrast();
    
    // 2. Verificar etiquetas ARIA
    this.checkAriaLabels();
    
    // 3. Verificar navegación por teclado
    this.checkKeyboardNavigation();
    
    // 4. Verificar imágenes sin alt text
    this.checkImageAltText();
    
    // 5. Verificar formularios
    this.checkForms();
    
    console.log(`[Accessibility] 🔍 Auditoría completada: ${this.violations.length} violaciones encontradas`);
    return [...this.violations];
  }

  private checkColorContrast(): void {
    const elements = document.querySelectorAll('*');
    
    elements.forEach(element => {
      const style = window.getComputedStyle(element);
      const bgColor = style.backgroundColor;
      const textColor = style.color;
      
      // Verificar contraste (implementación simplificada)
      if (this.isTextElement(element)) {
        // Aquí iría la lógica real de cálculo de contraste
        const violation: AccessibilityViolation = {
          element: element as HTMLElement,
          violation: 'Contraste de color insuficiente',
          severity: 'error',
          wcagCriteria: ['1.4.3', '1.4.6'],
          suggestion: 'Aumentar el contraste entre texto y fondo'
        };
        this.violations.push(violation);
      }
    });
  }

  private checkAriaLabels(): void {
    const interactiveElements = document.querySelectorAll(
      'button, [role="button"], a, input, select, textarea'
    );
    
    interactiveElements.forEach(element => {
      const hasLabel = element.hasAttribute('aria-label') || 
                       element.hasAttribute('aria-labelledby') ||
                       (element as HTMLElement).textContent?.trim();
      
      if (!hasLabel) {
        const violation: AccessibilityViolation = {
          element: element as HTMLElement,
          violation: 'Elemento interactivo sin etiqueta',
          severity: 'error',
          wcagCriteria: ['4.1.2'],
          suggestion: 'Agregar aria-label, aria-labelledby o texto visible'
        };
        this.violations.push(violation);
      }
    });
  }

  private checkKeyboardNavigation(): void {
    const focusable = this.getFocusableElements();
    
    focusable.forEach(element => {
      const tabIndex = element.getAttribute('tabindex');
      if (tabIndex === '-1' && !element.hasAttribute('disabled')) {
        const violation: AccessibilityViolation = {
          element,
          violation: 'Elemento no enfocable por teclado',
          severity: 'error',
          wcagCriteria: ['2.1.1'],
          suggestion: 'Remover tabindex="-1" o hacer el elemento enfocable'
        };
        this.violations.push(violation);
      }
    });
  }

  private checkImageAltText(): void {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      const alt = img.getAttribute('alt');
      const isDecorative = img.getAttribute('role') === 'presentation' || 
                          img.getAttribute('aria-hidden') === 'true';
      
      if (!alt && !isDecorative) {
        const violation: AccessibilityViolation = {
          element: img as HTMLElement,
          violation: 'Imagen sin texto alternativo',
          severity: 'error',
          wcagCriteria: ['1.1.1'],
          suggestion: 'Agregar atributo alt descriptivo'
        };
        this.violations.push(violation);
      }
    });
  }

  private checkForms(): void {
    const inputs = document.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      const id = input.getAttribute('id');
      const hasLabel = document.querySelector(`label[for="${id}"]`) ||
                      input.closest('label') ||
                      input.hasAttribute('aria-label') ||
                      input.hasAttribute('aria-labelledby');
      
      if (!hasLabel) {
        const violation: AccessibilityViolation = {
          element: input as HTMLElement,
          violation: 'Campo de formulario sin etiqueta',
          severity: 'error',
          wcagCriteria: ['3.3.2'],
          suggestion: 'Agregar etiqueta asociada'
        };
        this.violations.push(violation);
      }
    });
  }

  private isTextElement(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    return ['p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'button', 'label'].includes(tagName);
  }

  private isInFocusTrap(element: HTMLElement): boolean {
    const trap = element.closest('[data-focus-trap]');
    return trap !== null;
  }

  private focusNextInTrap(currentElement: HTMLElement): void {
    const trap = currentElement.closest('[data-focus-trap]');
    if (!trap) return;
    
    const focusable = Array.from(trap.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(el => {
      const element = el as HTMLElement;
      return !element.hasAttribute('disabled') && element.offsetParent !== null;
    }) as HTMLElement[];
    
    if (focusable.length === 0) return;
    
    const currentIndex = focusable.indexOf(currentElement);
    const nextIndex = (currentIndex + 1) % focusable.length;
    
    focusable[nextIndex].focus();
  }

  // ===== API PÚBLICA =====
  
  public getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  public getViolations(): AccessibilityViolation[] {
    return [...this.violations];
  }

  public clearViolations(): void {
    this.violations = [];
  }

  public focusElement(selector: string): boolean {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      return true;
    }
    return false;
  }

  public announceToScreenReader(message: string): void {
    if (this.isFeatureEnabled(AccessibilityFeature.SCREEN_READER)) {
      this.speak(message);
    }
  }
}

// Instancia global
export const accessibilityManager = AccessibilityManager.getInstance();

// Hooks React
import { useEffect, useState } from 'react';

export function useAccessibility(): {
  isFeatureEnabled: (feature: AccessibilityFeature) => boolean;
  enableFeature: (feature: AccessibilityFeature) => void;
  disableFeature: (feature: AccessibilityFeature) => void;
  fontSize: number;
  setFontSize: (percentage: number) => void;
  violations: AccessibilityViolation[];
  audit: () => void;
} {
  const [fontSize, setFontSizeState] = useState(100);
  const [violations, setViolations] = useState<AccessibilityViolation[]>([]);
  
  useEffect(() => {
    accessibilityManager.initialize();
    setFontSizeState(accessibilityManager.getConfig().fontSize);
  }, []);
  
  const isFeatureEnabled = (feature: AccessibilityFeature): boolean => {
    return accessibilityManager.isFeatureEnabled(feature);
  };
  
  const enableFeature = (feature: AccessibilityFeature): void => {
    accessibilityManager.enableFeature(feature);
  };
  
  const disableFeature = (feature: AccessibilityFeature): void => {
    accessibilityManager.disableFeature(feature);
  };
  
  const setFontSize = (percentage: number): void => {
    accessibilityManager.setFontSize(percentage);
    setFontSizeState(percentage);
  };
  
  const audit = (): void => {
    const newViolations = accessibilityManager.auditPage();
    setViolations(newViolations);
  };
  
  return {
    isFeatureEnabled,
    enableFeature,
    disableFeature,
    fontSize,
    setFontSize,
    violations,
    audit
  };
}

export function useKeyboardShortcut(
  key: string,
  action: () => void,
  dependencies: any[] = []
): void {
  useEffect(() => {
    accessibilityManager.registerKeyboardShortcut(key, action);
    
    return () => {
      accessibilityManager.unregisterKeyboardShortcut(key);
    };
  }, [key, action, ...dependencies]);
}

export function useFocusManagement(
  elementRef: React.RefObject<HTMLElement>,
  options?: {
    trapFocus?: boolean;
    autoFocus?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
  }
): void {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    if (options?.autoFocus) {
      element.focus();
    }
    
    if (options?.trapFocus) {
      element.setAttribute('data-focus-trap', 'true');
    }
    
    if (options?.onFocus) {
      element.addEventListener('focus', options.onFocus);
    }
    
    if (options?.onBlur) {
      element.addEventListener('blur', options.onBlur);
    }
    
    return () => {
      if (options?.trapFocus) {
        element.removeAttribute('data-focus-trap');
      }
      
      if (options?.onFocus) {
        element.removeEventListener('focus', options.onFocus);
      }
      
      if (options?.onBlur) {
        element.removeEventListener('blur', options.onBlur);
      }
    };
  }, [elementRef, options]);
}