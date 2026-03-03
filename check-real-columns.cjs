const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('Inventario_Export_Cauplas.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
  console.log('=== TODAS LAS COLUMNAS ===\n');
  Object.keys(jsonData[0]).forEach((col, i) => {
    console.log(`${i + 1}. "${col}"`);
  });
  
  console.log('\n=== ANÁLISIS DE TIPO DE COMBUSTIBLE ===');
  const combustibleCol = Object.keys(jsonData[0]).find(k => 
    k.toLowerCase().includes('combustible') || k.toLowerCase().includes('tipo de')
  );
  
  if (combustibleCol) {
    console.log(`Columna encontrada: "${combustibleCol}"`);
    console.log('\nPrimeros 20 valores:');
    for (let i = 0; i < Math.min(20, jsonData.length); i++) {
      const value = jsonData[i][combustibleCol];
      console.log(`${i + 1}. ${jsonData[i]['CAUPLAS']}: "${value || '(vacío)'}"`);
    }
    
    // Contar valores
    const valores = {};
    let vacios = 0;
    jsonData.forEach(row => {
      const val = row[combustibleCol];
      if (val === undefined || val === null || val === '') {
        vacios++;
      } else {
        valores[val] = (valores[val] || 0) + 1;
      }
    });
    
    console.log('\n=== RESUMEN ===');
    console.log('Valores únicos:', Object.keys(valores));
    console.log('Distribución:');
    Object.entries(valores).forEach(([val, count]) => {
      console.log(`  "${val}": ${count} productos`);
    });
    console.log(`  (vacío): ${vacios} productos`);
  } else {
    console.log('NO ENCONTRADA');
  }
  
  console.log('\n=== ANÁLISIS DE NUEVOS ITEMS ===');
  const nuevosCol = Object.keys(jsonData[0]).find(k => 
    k.toLowerCase().includes('nuevo') || k.toLowerCase().includes('items')
  );
  
  if (nuevosCol) {
    console.log(`Columna encontrada: "${nuevosCol}"`);
    console.log('\nPrimeros 20 valores:');
    for (let i = 0; i < Math.min(20, jsonData.length); i++) {
      const value = jsonData[i][nuevosCol];
      console.log(`${i + 1}. ${jsonData[i]['CAUPLAS']}: "${value || '(vacío)'}"`);
    }
    
    // Contar valores
    const valores = {};
    let vacios = 0;
    jsonData.forEach(row => {
      const val = row[nuevosCol];
      if (val === undefined || val === null || val === '') {
        vacios++;
      } else {
        valores[val] = (valores[val] || 0) + 1;
      }
    });
    
    console.log('\n=== RESUMEN ===');
    console.log('Valores únicos:', Object.keys(valores));
    console.log('Distribución:');
    Object.entries(valores).forEach(([val, count]) => {
      console.log(`  "${val}": ${count} productos`);
    });
    console.log(`  (vacío): ${vacios} productos`);
  } else {
    console.log('NO ENCONTRADA');
  }
  
} catch (error) {
  console.error('Error:', error.message);
}
