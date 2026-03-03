import * as fs from 'fs';
import * as path from 'path';

function generateBarrelExport(modulePath: string) {
  const indexPath = path.join(modulePath, 'index.ts');
  const subdirs = ['components', 'hooks', 'services', 'types', 'pages'];
  
  let content = '// Auto-generated barrel export\n';
  content += '// This file exports all public APIs from this module\n\n';
  
  const existingSubdirs: string[] = [];
  
  for (const subdir of subdirs) {
    const subdirPath = path.join(modulePath, subdir);
    if (fs.existsSync(subdirPath)) {
      existingSubdirs.push(subdir);
      content += `export * from './${subdir}';\n`;
    }
  }
  
  if (existingSubdirs.length === 0) {
    console.log(`⚠️  No subdirectories found in: ${modulePath}`);
    return;
  }
  
  fs.writeFileSync(indexPath, content, 'utf-8');
  console.log(`✅ Generated barrel export: ${indexPath}`);
  console.log(`   Exported: ${existingSubdirs.join(', ')}`);
}

function generateSubdirBarrelExports(subdirPath: string) {
  if (!fs.existsSync(subdirPath)) return;
  
  const files = fs.readdirSync(subdirPath, { withFileTypes: true })
    .filter(entry => entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && entry.name !== 'index.ts')
    .map(entry => entry.name);
  
  if (files.length === 0) return;
  
  const indexPath = path.join(subdirPath, 'index.ts');
  let content = '// Auto-generated barrel export\n\n';
  
  for (const file of files) {
    const fileName = file.replace(/\.(ts|tsx)$/, '');
    content += `export * from './${fileName}';\n`;
  }
  
  fs.writeFileSync(indexPath, content, 'utf-8');
  console.log(`✅ Generated barrel export: ${indexPath} (${files.length} files)`);
}

function generateAllBarrelExports() {
  console.log('📦 Generating barrel exports...\n');
  
  // Frontend modules
  const frontendModulesPath = 'src/modules';
  if (fs.existsSync(frontendModulesPath)) {
    const modules = fs.readdirSync(frontendModulesPath, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
    
    console.log('Frontend Modules:\n');
    for (const module of modules) {
      const modulePath = path.join(frontendModulesPath, module);
      generateBarrelExport(modulePath);
      
      // Generar barrel exports para subdirectorios
      const subdirs = ['components', 'hooks', 'services', 'types', 'pages'];
      for (const subdir of subdirs) {
        generateSubdirBarrelExports(path.join(modulePath, subdir));
      }
    }
  }
  
  // Backend modules
  console.log('\nBackend Modules:\n');
  const backendModulesPath = 'backend/src/modules';
  if (fs.existsSync(backendModulesPath)) {
    const modules = fs.readdirSync(backendModulesPath, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
    
    for (const module of modules) {
      const modulePath = path.join(backendModulesPath, module);
      generateBarrelExport(modulePath);
      
      // Generar barrel exports para subdirectorios
      const subdirs = ['controllers', 'services', 'routes', 'models', 'types'];
      for (const subdir of subdirs) {
        generateSubdirBarrelExports(path.join(modulePath, subdir));
      }
    }
  }
  
  // Core modules
  console.log('\nCore Modules:\n');
  const coreModulesPath = 'src/core';
  if (fs.existsSync(coreModulesPath)) {
    const coreModules = fs.readdirSync(coreModulesPath, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
    
    for (const module of coreModules) {
      const modulePath = path.join(coreModulesPath, module);
      generateBarrelExport(modulePath);
    }
  }
  
  console.log('\n✅ All barrel exports generated!\n');
}

generateAllBarrelExports();
