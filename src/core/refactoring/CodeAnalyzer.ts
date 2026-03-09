/**
 * CodeAnalyzer - Sistema de análisis y refactorización de código
 * Incluye: detección de duplicados, métricas de código, sugerencias de refactor
 */

export interface CodeIssue {
  type: 'duplicate' | 'complexity' | 'dependency' | 'performance' | 'maintainability';
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion: string;
  codeSnippet: string;
}

export interface CodeMetrics {
  linesOfCode: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  duplicationRate: number;
  dependencyCount: number;
  maintainabilityIndex: number;
  testCoverage?: number;
}

export interface RefactoringSuggestion {
  id: string;
  title: string;
  description: string;
  files: string[];
  estimatedEffort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  priority: number;
  steps: string[];
  beforeExample?: string;
  afterExample?: string;
}

export class CodeAnalyzer {
  private static instance: CodeAnalyzer;
  private issues: CodeIssue[] = [];
  private metrics: Map<string, CodeMetrics> = new Map();
  private suggestions: RefactoringSuggestion[] = [];

  private constructor() {}

  public static getInstance(): CodeAnalyzer {
    if (!CodeAnalyzer.instance) {
      CodeAnalyzer.instance = new CodeAnalyzer();
    }
    return CodeAnalyzer.instance;
  }

  // ===== ANÁLISIS DE CÓDIGO =====
  
  public async analyzeFile(filePath: string, content: string): Promise<CodeIssue[]> {
    const fileIssues: CodeIssue[] = [];
    
    // 1. Detectar código duplicado (simplificado)
    const duplicateIssues = this.detectDuplicates(content, filePath);
    fileIssues.push(...duplicateIssues);
    
    // 2. Analizar complejidad ciclomática
    const complexityIssues = this.analyzeComplexity(content, filePath);
    fileIssues.push(...complexityIssues);
    
    // 3. Analizar dependencias
    const dependencyIssues = this.analyzeDependencies(content, filePath);
    fileIssues.push(...dependencyIssues);
    
    // 4. Analizar rendimiento
    const performanceIssues = this.analyzePerformance(content, filePath);
    fileIssues.push(...performanceIssues);
    
    // 5. Calcular métricas
    const metrics = this.calculateMetrics(content, filePath);
    this.metrics.set(filePath, metrics);
    
    this.issues.push(...fileIssues);
    return fileIssues;
  }

  public async analyzeProject(files: Map<string, string>): Promise<{
    issues: CodeIssue[];
    metrics: Map<string, CodeMetrics>;
    suggestions: RefactoringSuggestion[];
  }> {
    console.log('[CodeAnalyzer] 🔍 Analizando proyecto...');
    
    this.issues = [];
    this.metrics.clear();
    this.suggestions = [];
    
    // Analizar cada archivo
    for (const [filePath, content] of files.entries()) {
      await this.analyzeFile(filePath, content);
    }
    
    // Analizar duplicados entre archivos
    const crossFileDuplicates = this.detectCrossFileDuplicates(files);
    this.issues.push(...crossFileDuplicates);
    
    // Generar sugerencias de refactor
    this.generateRefactoringSuggestions();
    
    console.log(`[CodeAnalyzer] ✅ Análisis completado:`);
    console.log(`  • Archivos analizados: ${files.size}`);
    console.log(`  • Issues encontrados: ${this.issues.length}`);
    console.log(`  • Sugerencias: ${this.suggestions.length}`);
    
    return {
      issues: this.issues,
      metrics: this.metrics,
      suggestions: this.suggestions
    };
  }

  // ===== DETECCIÓN DE DUPLICADOS =====
  
  private detectDuplicates(content: string, filePath: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');
    
    // Buscar patrones duplicados (simplificado)
    const patterns = [
      { pattern: /const\s+\w+\s*=\s*useState\(/g, message: 'Hook useState duplicado' },
      { pattern: /const\s+\w+\s*=\s*useEffect\(/g, message: 'Hook useEffect duplicado' },
      { pattern: /const\s+\w+\s*=\s*useCallback\(/g, message: 'Hook useCallback duplicado' },
      { pattern: /const\s+\w+\s*=\s*useMemo\(/g, message: 'Hook useMemo duplicado' },
      { pattern: /console\.(log|error|warn|info)\(/g, message: 'Console statement' }
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const { pattern, message } of patterns) {
        const matches = line.match(pattern);
        if (matches && matches.length > 1) {
          issues.push({
            type: 'duplicate',
            file: filePath,
            line: i + 1,
            column: line.indexOf(matches[0]) + 1,
            message: `${message} en la misma línea`,
            severity: 'warning',
            suggestion: 'Extraer a función o hook personalizado',
            codeSnippet: line.trim()
          });
        }
      }
    }
    
    return issues;
  }

  private detectCrossFileDuplicates(files: Map<string, string>): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const fileContents = Array.from(files.entries());
    
    // Comparar cada archivo con los demás (simplificado)
    for (let i = 0; i < fileContents.length; i++) {
      for (let j = i + 1; j < fileContents.length; j++) {
        const [file1, content1] = fileContents[i];
        const [file2, content2] = fileContents[j];
        
        // Buscar funciones similares (por nombre)
        const functions1 = this.extractFunctions(content1);
        const functions2 = this.extractFunctions(content2);
        
        for (const func1 of functions1) {
          for (const func2 of functions2) {
            if (func1.name === func2.name && func1.name !== '') {
              issues.push({
                type: 'duplicate',
                file: file1,
                line: func1.line,
                column: func1.column,
                message: `Función "${func1.name}" duplicada en ${file2}`,
                severity: 'warning',
                suggestion: 'Extraer a archivo compartido o utilidad común',
                codeSnippet: func1.signature
              });
            }
          }
        }
      }
    }
    
    return issues;
  }

  private extractFunctions(content: string): Array<{
    name: string;
    signature: string;
    line: number;
    column: number;
  }> {
    const functions: Array<{
      name: string;
      signature: string;
      line: number;
      column: number;
    }> = [];
    
    const lines = content.split('\n');
    const functionPatterns = [
      /function\s+(\w+)\s*\(/,
      /const\s+(\w+)\s*=\s*(?:async\s*)?\(?.*\)?\s*=>/,
      /export\s+(?:const|function|default\s+function)\s+(\w+)/,
      /class\s+(\w+)/
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const pattern of functionPatterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
          functions.push({
            name: match[1],
            signature: line.trim(),
            line: i + 1,
            column: line.indexOf(match[1]) + 1
          });
        }
      }
    }
    
    return functions;
  }

  // ===== ANÁLISIS DE COMPLEJIDAD =====
  
  private analyzeComplexity(content: string, filePath: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');
    
    // Patrones que aumentan complejidad
    const complexityPatterns = [
      { pattern: /if\s*\(/g, weight: 1, message: 'Sentencia if' },
      { pattern: /else\s*if\s*\(/g, weight: 1, message: 'Sentencia else if' },
      { pattern: /for\s*\(/g, weight: 1, message: 'Bucle for' },
      { pattern: /while\s*\(/g, weight: 1, message: 'Bucle while' },
      { pattern: /switch\s*\(/g, weight: 1, message: 'Sentencia switch' },
      { pattern: /catch\s*\(/g, weight: 1, message: 'Bloque catch' },
      { pattern: /\?\s*:/g, weight: 1, message: 'Operador ternario' },
      { pattern: /&&/g, weight: 0.5, message: 'Operador AND' },
      { pattern: /\|\|/g, weight: 0.5, message: 'Operador OR' }
    ];
    
    let totalComplexity = 0;
    let functionStart = -1;
    let currentFunction = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detectar inicio de función
      if (line.match(/function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(?.*\)?\s*=>/)) {
        functionStart = i;
        currentFunction = line.trim();
      }
      
      // Calcular complejidad de la línea
      let lineComplexity = 0;
      for (const { pattern, weight } of complexityPatterns) {
        const matches = line.match(pattern);
        if (matches) {
          lineComplexity += matches.length * weight;
        }
      }
      
      totalComplexity += lineComplexity;
      
      // Reportar funciones complejas
      if (lineComplexity > 3 && functionStart !== -1) {
        issues.push({
          type: 'complexity',
          file: filePath,
          line: i + 1,
          column: 1,
          message: `Línea con alta complejidad (${lineComplexity})`,
          severity: 'warning',
          suggestion: 'Simplificar lógica condicional o extraer a funciones más pequeñas',
          codeSnippet: line.trim()
        });
      }
      
      // Detectar fin de función (simplificado)
      if (line.match(/^\s*}$/) && functionStart !== -1) {
        if (totalComplexity > 10) {
          issues.push({
            type: 'complexity',
            file: filePath,
            line: functionStart + 1,
            column: 1,
            message: `Función con alta complejidad ciclomática (${totalComplexity})`,
            severity: 'warning',
            suggestion: 'Refactorizar en funciones más pequeñas y enfocadas',
            codeSnippet: currentFunction
          });
        }
        
        functionStart = -1;
        currentFunction = '';
        totalComplexity = 0;
      }
    }
    
    return issues;
  }

  // ===== ANÁLISIS DE DEPENDENCIAS =====
  
  private analyzeDependencies(content: string, filePath: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    
    // Detectar imports circulares (simplificado)
    const importLines = content.split('\n').filter(line => line.includes('import'));
    
    // Contar número de imports
    const importCount = importLines.length;
    if (importCount > 20) {
      issues.push({
        type: 'dependency',
        file: filePath,
        line: 1,
        column: 1,
        message: `Muchas dependencias (${importCount} imports)`,
        severity: 'warning',
        suggestion: 'Considerar dividir el módulo o usar lazy loading',
        codeSnippet: `Total imports: ${importCount}`
      });
    }
    
    // Detectar imports de módulos grandes
    const largeModules = ['lodash', 'moment', 'date-fns', 'axios', 'react-query'];
    for (const line of importLines) {
      for (const module of largeModules) {
        if (line.includes(module)) {
          issues.push({
            type: 'dependency',
            file: filePath,
            line: content.split('\n').indexOf(line) + 1,
            column: line.indexOf(module) + 1,
            message: `Importación de módulo grande: ${module}`,
            severity: 'info',
            suggestion: `Considerar importación selectiva (${module}/especifico) o alternativas más ligeras`,
            codeSnippet: line.trim()
          });
        }
      }
    }
    
    return issues;
  }

  // ===== ANÁLISIS DE RENDIMIENTO =====
  
  private analyzePerformance(content: string, filePath: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');
    
    // Patrones de rendimiento problemáticos
    const performancePatterns = [
      {
        pattern: /\.map\(.*\)\.map\(/g,
        message: 'Múltiples .map() anidados',
        suggestion: 'Combinar en un solo .map() o usar .flatMap()'
      },
      {
        pattern: /\.filter\(.*\)\.filter\(/g,
        message: 'Múltiples .filter() anidados',
        suggestion: 'Combinar condiciones en un solo .filter()'
      },
      {
        pattern: /JSON\.parse\(JSON\.stringify\(/g,
        message: 'Deep copy ineficiente con JSON',
        suggestion: 'Usar structuredClone() o librerías específicas'
      },
      {
        pattern: /Array\(.*\)\.fill\(/g,
        message: 'Inicialización de array ineficiente',
        suggestion: 'Usar Array.from() o new Array() con fill'
      },
      {
        pattern: /for\s*\(\s*let\s+i\s*=\s*0[^;]+length[^)]+\)/g,
        message: 'Bucle for con .length en condición',
        suggestion: 'Cachear .length fuera del bucle'
      }
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const { pattern, message, suggestion } of performancePatterns) {
        if (line.match(pattern)) {
          issues.push({
            type: 'performance',
            file: filePath,
            line: i + 1,
            column: line.match(pattern)!.index! + 1,
            message,
            severity: 'warning',
            suggestion,
            codeSnippet: line.trim()
          });
        }
      }
    }
    
    return issues;
  }

  // ===== CÁLCULO DE MÉTRICAS =====
  
  private calculateMetrics(content: string, filePath: string): CodeMetrics {
    const lines = content.split('\n');
    
    // Líneas de código (excluyendo vacías y comentarios)
    const linesOfCode = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('/*');
    }).length;
    
    // Complejidad ciclomática (simplificada)
    let cyclomaticComplexity = 1; // Base
    
    const complexityKeywords = ['if', 'else', 'for', 'while', 'case', 'catch', '&&', '||', '?', '??'];
    for (const line of lines) {
      for (const keyword of complexityKeywords) {
        if (line.includes(keyword)) {
          cyclomaticComplexity++;
        }
      }
    }
    
    // Tasa de duplicación (estimada)
    const uniqueLines = new Set(lines.map(line => line.trim()).filter(line => line.length > 0));
    const duplicationRate = linesOfCode > 0 ? 
      (linesOfCode - uniqueLines.size) / linesOfCode * 100 : 0;
    
    // Índice de mantenibilidad (simplificado)
    const maintainabilityIndex = Math.max(0, Math.min(100, 
      171 - 5.2 * Math.log(cyclomaticComplexity) - 0.23 * duplicationRate - 16.2 * Math.log(linesOfCode)
    ));
    
    return {
      linesOfCode,
      cyclomaticComplexity,
      cognitiveComplexity: cyclomaticComplexity * 1.5, // Estimación
      duplicationRate,
      dependencyCount: (content.match(/import/g) || []).length,
      maintainabilityIndex
    };
  }

  // ===== SUGERENCIAS DE REFACTOR =====
  
  private generateRefactoringSuggestions(): void {
    this.suggestions = [];
    
    // Agrupar issues por tipo y archivo
    const duplicateIssues = this.issues.filter(issue => issue.type === 'duplicate');
    const complexityIssues = this.issues.filter(issue => issue.type === 'complexity');
    const performanceIssues = this.issues.filter(issue => issue.type === 'performance');
    
    // Sugerencia 1: Extraer utilidades comunes
    if (duplicateIssues.length > 5) {
      const duplicateFiles = [...new Set(duplicateIssues.map(issue => issue.file))];
      
      this.suggestions.push({
        id: 'extract-common-utilities',
        title: 'Extraer utilidades comunes',
        description: 'Se detectaron múltiples funciones duplicadas en diferentes archivos. Extraerlas a un archivo de utilidades compartidas mejorará la mantenibilidad y reducirá la duplicación.',
        files: duplicateFiles,
        estimatedEffort: 'medium',
        impact: 'high',
        priority: 1,
        steps: [
          'Identificar funciones duplicadas',
          'Crear archivo src/shared/utils/common.ts',
          'Mover funciones duplicadas al archivo común',
          'Actualizar imports en los archivos originales',
          'Ejecutar tests para verificar que todo funciona'
        ],
        beforeExample: '// En múltiples archivos\nconst formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;',
        afterExample: '// En src/shared/utils/common.ts\nexport const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;\n\n// En archivos originales\nimport { formatCurrency } from "@/shared/utils/common";'
      });
    }
    
    // Sugerencia 2: Refactorizar funciones complejas
    if (complexityIssues.length > 3) {
      const complexFiles = [...new Set(complexityIssues.map(issue => issue.file))];
      
      this.suggestions.push({
        id: 'refactor-complex-functions',
        title: 'Refactorizar funciones complejas',
        description: 'Se detectaron funciones con alta complejidad ciclomática. Refactorizarlas en funciones más pequeñas mejorará la legibilidad y mantenibilidad.',
        files: complexFiles,
        estimatedEffort: 'high',
        impact: 'medium',
        priority: 2,
        steps: [
          'Identificar las funciones más complejas',
          'Extraer lógica condicional a funciones separadas',
          'Usar early returns para simplificar flujo',
          'Aplicar principios de función única responsabilidad',
          'Actualizar llamadas a las funciones refactorizadas'
        ],
        beforeExample: 'function processOrder(order) {\n  if (order.status === "pending") {\n    // 50 líneas de código...\n  } else if (order.status === "processing") {\n    // 30 líneas de código...\n  }\n  // más condiciones...\n}',
        afterExample: 'function processPendingOrder(order) {\n  // 50 líneas de código...\n}\n\nfunction processProcessingOrder(order) {\n  // 30 líneas de código...\n}\n\nfunction processOrder(order) {\n  switch (order.status) {\n    case "pending": return processPendingOrder(order);\n    case "processing": return processProcessingOrder(order);\n  }\n}'
      });
    }
    
    // Sugerencia 3: Optimizar rendimiento
    if (performanceIssues.length > 2) {
      const performanceFiles = [...new Set(performanceIssues.map(issue => issue.file))];
      
      this.suggestions.push({
        id: 'optimize-performance-patterns',
        title: 'Optimizar patrones de rendimiento',
        description: 'Se detectaron patrones de código que pueden afectar el rendimiento. Optimizarlos mejorará la velocidad de la aplicación.',
        files: performanceFiles,
        estimatedEffort: 'low',
        impact: 'medium',
        priority: 3,
        steps: [
          'Reemplazar múltiples .map() anidados por un solo .map()',
          'Combinar múltiples .filter() en uno solo',
          'Cachear .length en bucles for',
          'Usar structuredClone() en lugar de JSON.parse(JSON.stringify())',
          'Considerar uso de Web Workers para operaciones pesadas'
        ],
        beforeExample: '// Múltiples .map() anidados\nconst result = data.map(x => x.value).map(y => y * 2).map(z => z.toFixed(2));',
        afterExample: '// Un solo .map() optimizado\nconst result = data.map(x => (x.value * 2).toFixed(2));'
      });
    }
    
    // Sugerencia 4: Mejorar estructura de imports
    const filesWithManyImports = Array.from(this.metrics.entries())
      .filter(([_, metrics]) => metrics.dependencyCount > 15)
      .map(([file]) => file);
    
    if (filesWithManyImports.length > 0) {
      this.suggestions.push({
        id: 'optimize-imports-structure',
        title: 'Optimizar estructura de imports',
        description: 'Algunos archivos tienen muchas dependencias, lo que puede afectar el tiempo de carga y la mantenibilidad.',
        files: filesWithManyImports,
        estimatedEffort: 'medium',
        impact: 'low',
        priority: 4,
        steps: [
          'Agrupar imports por tipo (react, librerías, internos)',
          'Usar importaciones selectivas de librerías grandes',
          'Considerar lazy loading para componentes pesados',
          'Extraer lógica a hooks personalizados para reducir dependencias',
          'Usar barrel exports para imports más limpios'
        ],
        beforeExample: 'import { useState, useEffect, useCallback } from "react";\nimport { Button, Input, Card } from "@/shared/components/ui";\nimport { formatCurrency, formatDate } from "@/lib";\n// 15 imports más...',
        afterExample: '// React\nimport { useState, useEffect, useCallback } from "react";\n\n// UI Components\nimport { Button, Input, Card } from "@/shared/components/ui";\n\n// Utils\nimport { formatCurrency, formatDate } from "@/lib";\n\n// Hooks personalizados\nimport { useProducts } from "@/modules/inventory/hooks";'
      });
    }
  }

  // ===== API PÚBLICA =====
  
  public getIssues(): CodeIssue[] {
    return [...this.issues];
  }

  public getMetrics(): Map<string, CodeMetrics> {
    return new Map(this.metrics);
  }

  public getSuggestions(): RefactoringSuggestion[] {
    return [...this.suggestions];
  }

  public getSummary(): {
    totalIssues: number;
    issuesBySeverity: Record<string, number>;
    issuesByType: Record<string, number>;
    averageMaintainability: number;
    filesWithHighComplexity: number;
  } {
    const issuesBySeverity = {
      error: this.issues.filter(i => i.severity === 'error').length,
      warning: this.issues.filter(i => i.severity === 'warning').length,
      info: this.issues.filter(i => i.severity === 'info').length
    };
    
    const issuesByType = {
      duplicate: this.issues.filter(i => i.type === 'duplicate').length,
      complexity: this.issues.filter(i => i.type === 'complexity').length,
      dependency: this.issues.filter(i => i.type === 'dependency').length,
      performance: this.issues.filter(i => i.type === 'performance').length,
      maintainability: this.issues.filter(i => i.type === 'maintainability').length
    };
    
    const metricsArray = Array.from(this.metrics.values());
    const averageMaintainability = metricsArray.length > 0 ?
      metricsArray.reduce((sum, m) => sum + m.maintainabilityIndex, 0) / metricsArray.length : 0;
    
    const filesWithHighComplexity = Array.from(this.metrics.entries())
      .filter(([_, m]) => m.cyclomaticComplexity > 10)
      .length;
    
    return {
      totalIssues: this.issues.length,
      issuesBySeverity,
      issuesByType,
      averageMaintainability,
      filesWithHighComplexity
    };
  }

  public clear(): void {
    this.issues = [];
    this.metrics.clear();
    this.suggestions = [];
  }
}

// Instancia global
export const codeAnalyzer = CodeAnalyzer.getInstance();

// Utilidades para uso en desarrollo
export async function analyzeCurrentProject(): Promise<void> {
  console.log('[CodeAnalyzer] 🚀 Iniciando análisis del proyecto...');
  
  // En un entorno real, aquí se leerían los archivos del proyecto
  // Por ahora, solo mostramos un ejemplo
  
  const exampleFiles = new Map<string, string>();
  exampleFiles.set('src/example.ts', `
    function complexFunction(x: number) {
      if (x > 0) {
        if (x < 10) {
          return x * 2;
        } else if (x < 20) {
          return x * 3;
        } else {
          return x * 4;
        }
      }
      return 0;
    }
    
    const duplicateFunction = (x: number) => x * 2;
  `);
  
  const result = await codeAnalyzer.analyzeProject(exampleFiles);
  
  console.log('[CodeAnalyzer] 📊 Resultados del análisis:');
  console.log(JSON.stringify(result.getSummary(), null, 2));
  
  if (result.suggestions.length > 0) {
    console.log('\n[CodeAnalyzer] 💡 Sugerencias de refactor:');
    result.suggestions.forEach((suggestion, index) => {
      console.log(`\n${index + 1}. ${suggestion.title}`);
      console.log(`   ${suggestion.description}`);
      console.log(`   Esfuerzo: ${suggestion.estimatedEffort}, Impacto: ${suggestion.impact}`);
    });
  }
}

// Hook React para análisis en tiempo de desarrollo
import { useEffect, useState } from 'react';

export function useCodeAnalysis(filePath?: string): {
  issues: CodeIssue[];
  metrics: CodeMetrics | null;
  suggestions: RefactoringSuggestion[];
  isLoading: boolean;
  analyze: () => Promise<void>;
} {
  const [issues, setIssues] = useState<CodeIssue[]>([]);
  const [metrics, setMetrics] = useState<CodeMetrics | null>(null);
  const [suggestions, setSuggestions] = useState<RefactoringSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const analyze = async () => {
    setIsLoading(true);
    
    try {
      if (filePath) {
        // Analizar archivo específico
        // En un entorno real, aquí se leería el archivo
        const fileIssues = await codeAnalyzer.analyzeFile(filePath, '');
        setIssues(fileIssues);
        
        const fileMetrics = codeAnalyzer.getMetrics().get(filePath);
        setMetrics(fileMetrics || null);
      } else {
        // Analizar proyecto completo
        // Esto es solo un ejemplo - en producción se necesitaría leer los archivos reales
        const exampleFiles = new Map<string, string>();
        const result = await codeAnalyzer.analyzeProject(exampleFiles);
        
        setIssues(result.issues);
        setMetrics(Array.from(result.metrics.values())[0] || null);
        setSuggestions(result.suggestions);
      }
    } catch (error) {
      console.error('[useCodeAnalysis] Error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Auto-analizar en desarrollo
      analyze();
    }
  }, [filePath]);
  
  return {
    issues,
    metrics,
    suggestions,
    isLoading,
    analyze
  };
}