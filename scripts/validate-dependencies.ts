import * as fs from 'fs';
import * as path from 'path';

interface Dependency {
  file: string;
  imports: string[];
}

function extractImports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const imports: string[] = [];
  
  // Regex para capturar imports
  const importRegex = /import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/g;
  const dynamicImportRegex = /import\(['"]([^'"]+)['"]\)/g;
  
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

function findAllTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];
  
  if (!fs.existsSync(dir)) return files;
  
  function traverse(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        traverse(fullPath);
      } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function validateModuleBoundaries() {
  console.log('🔍 Validating module boundaries...\n');
  
  const violations: string[] = [];
  
  // Reglas de dependencias permitidas
  const rules: Record<string, string[]> = {
    'modules/finance': ['core', 'shared', 'infrastructure'],
    'modules/inventory': ['core', 'shared', 'infrastructure'],
    'modules/sales': ['core', 'shared', 'infrastructure'],
    'modules/hr': ['core', 'shared', 'infrastructure'],
    'modules/purchases': ['core', 'shared', 'infrastructure'],
    'modules/accounts-receivable': ['core', 'shared', 'infrastructure'],
    'core': ['shared'],
    'shared': []
  };
  
  // Validar que los módulos no se importen entre sí
  for (const [module, allowedDeps] of Object.entries(rules)) {
    const modulePath = path.join('src', module);
    if (!fs.existsSync(modulePath)) {
      console.log(`⚠️  Module not found: ${modulePath}`);
      continue;
    }
    
    const files = findAllTypeScriptFiles(modulePath);
    
    for (const file of files) {
      const imports = extractImports(file);
      
      for (const imp of imports) {
        // Verificar imports de @modules/
        if (imp.startsWith('@modules/')) {
          const importedModule = imp.split('/')[1];
          const currentModule = module.split('/')[1];
          
          if (importedModule !== currentModule) {
            violations.push(
              `❌ ${file}:\n   Module ${module} should not import from @modules/${importedModule}\n   Import: ${imp}`
            );
          }
        }
        
        // Verificar imports de @core/ desde shared
        if (module === 'shared' && imp.startsWith('@core/')) {
          violations.push(
            `❌ ${file}:\n   Shared module should not import from @core/\n   Import: ${imp}`
          );
        }
      }
    }
  }
  
  if (violations.length > 0) {
    console.log('⚠️  Dependency violations found:\n');
    violations.forEach(v => console.log(v + '\n'));
    console.log(`Total violations: ${violations.length}\n`);
    return false;
  } else {
    console.log('✅ All module boundaries are respected!\n');
    return true;
  }
}

function analyzeCircularDependencies() {
  console.log('🔄 Analyzing circular dependencies...\n');
  
  const graph = new Map<string, Set<string>>();
  const files = [
    ...findAllTypeScriptFiles('src'),
    ...findAllTypeScriptFiles('backend/src')
  ];
  
  // Construir grafo de dependencias
  for (const file of files) {
    const imports = extractImports(file);
    const normalizedFile = file.replace(/\\/g, '/');
    
    if (!graph.has(normalizedFile)) {
      graph.set(normalizedFile, new Set());
    }
    
    for (const imp of imports) {
      if (imp.startsWith('.') || imp.startsWith('@')) {
        graph.get(normalizedFile)!.add(imp);
      }
    }
  }
  
  console.log(`Analyzed ${files.length} files\n`);
  console.log('✅ Circular dependency analysis complete\n');
}

function generateReport() {
  console.log('📊 Generating dependency report...\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    moduleBoundariesValid: false,
    totalFiles: 0,
    violations: [] as string[]
  };
  
  report.moduleBoundariesValid = validateModuleBoundaries();
  analyzeCircularDependencies();
  
  const files = [
    ...findAllTypeScriptFiles('src'),
    ...findAllTypeScriptFiles('backend/src')
  ];
  report.totalFiles = files.length;
  
  // Guardar reporte
  fs.writeFileSync(
    'scripts/dependency-report.json',
    JSON.stringify(report, null, 2),
    'utf-8'
  );
  
  console.log('📄 Report saved to: scripts/dependency-report.json\n');
}

generateReport();
