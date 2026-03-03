const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('Inventario_Export_Cauplas.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Leer con header para ver los nombres de columnas
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
  console.log('=== TODAS LAS COLUMNAS DEL EXCEL ===\n');
  const columns = Object.keys(jsonData[0]);
  columns.forEach((col, index) => {
    const letter = String.fromCharCode(65 + index); // A=65, B=66, etc.
    console.log(`Columna ${letter} (${index + 1}): "${col}"`);
  });
  
  console.log('\n=== COLUMNA H (8) ===');
  const colH = columns[7]; // Índice 7 = columna H
  console.log('Nombre:', colH);
  console.log('\nPrimeros 10 valores:');
  for (let i = 0; i < Math.min(10, jsonData.length); i++) {
    const value = jsonData[i][colH];
    console.log(`Fila ${i + 1}: ${JSON.stringify(value)} (tipo: ${typeof value})`);
  }
  
  console.log('\n=== COLUMNA I (9) ===');
  const colI = columns[8]; // Índice 8 = columna I
  console.log('Nombre:', colI);
  console.log('\nPrimeros 10 valores:');
  for (let i = 0; i < Math.min(10, jsonData.length); i++) {
    const value = jsonData[i][colI];
    console.log(`Fila ${i + 1}: ${JSON.stringify(value)} (tipo: ${typeof value})`);
  }
  
  // Contar valores únicos en cada columna
  console.log('\n=== ANÁLISIS DE VALORES ===');
  
  const valoresH = new Set();
  const valoresI = new Set();
  let vaciosH = 0;
  let vaciosI = 0;
  
  jsonData.forEach(row => {
    const valH = row[colH];
    const valI = row[colI];
    
    if (valH === undefined || valH === null || valH === '') {
      vaciosH++;
    } else {
      valoresH.add(String(valH));
    }
    
    if (valI === undefined || valI === null || valI === '') {
      vaciosI++;
    } else {
      valoresI.add(String(valI));
    }
  });
  
  console.log(`\nColumna H (${colH}):`);
  console.log(`  - Valores únicos: ${valoresH.size}`);
  console.log(`  - Celdas vacías: ${vaciosH}`);
  console.log(`  - Valores: ${Array.from(valoresH).slice(0, 10).join(', ')}${valoresH.size > 10 ? '...' : ''}`);
  
  console.log(`\nColumna I (${colI}):`);
  console.log(`  - Valores únicos: ${valoresI.size}`);
  console.log(`  - Celdas vacías: ${vaciosI}`);
  console.log(`  - Valores: ${Array.from(valoresI).slice(0, 10).join(', ')}${valoresI.size > 10 ? '...' : ''}`);
  
} catch (error) {
  console.error('Error:', error.message);
}
