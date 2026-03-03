const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('Inventario_Export_Cauplas.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  console.log('=== RANGO DEL WORKSHEET ===');
  console.log('Rango:', worksheet['!ref']);
  
  // Leer sin header para ver todas las celdas
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  console.log(`Columnas: ${range.s.c} a ${range.e.c} (total: ${range.e.c - range.s.c + 1})`);
  console.log(`Filas: ${range.s.r} a ${range.e.r} (total: ${range.e.r - range.s.r + 1})`);
  
  console.log('\n=== ENCABEZADOS (FILA 1) ===');
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    const cell = worksheet[cellAddress];
    const letter = XLSX.utils.encode_col(col);
    console.log(`Columna ${letter} (${col + 1}): "${cell ? cell.v : '(vacía)'}"`);
  }
  
  // Leer con header: 1 para ver todas las columnas
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  console.log('\n=== PRIMERA FILA (ENCABEZADOS) ===');
  console.log(jsonData[0]);
  
  console.log('\n=== SEGUNDA FILA (PRIMER PRODUCTO) ===');
  console.log(jsonData[1]);
  
  // Buscar columnas H e I específicamente
  console.log('\n=== COLUMNAS H e I ===');
  console.log('Columna H (índice 7):', jsonData[0][7]);
  console.log('Columna I (índice 8):', jsonData[0][8]);
  
  console.log('\nPrimeros 5 valores de columna H:');
  for (let i = 1; i <= 5; i++) {
    console.log(`  Fila ${i + 1}: "${jsonData[i][7] || '(vacío)'}"`);
  }
  
  console.log('\nPrimeros 5 valores de columna I:');
  for (let i = 1; i <= 5; i++) {
    console.log(`  Fila ${i + 1}: "${jsonData[i][8] || '(vacío)'}"`);
  }
  
} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
}
