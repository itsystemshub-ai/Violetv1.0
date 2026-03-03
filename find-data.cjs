const XLSX = require('xlsx');

const workbook = XLSX.readFile('Inventario_Export_Cauplas.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log(`Total de filas: ${data.length}\n`);

// Buscar filas con datos en columnas H e I
let countH = 0;
let countI = 0;
const samplesH = [];
const samplesI = [];

data.forEach((row, index) => {
  const tipoCombustible = row["TIPO DE COMBUSTIBLE"];
  const nuevosItems = row["NUEVOS ITEMS"];
  
  if (tipoCombustible && String(tipoCombustible).trim() !== "") {
    countH++;
    if (samplesH.length < 5) {
      samplesH.push({
        fila: index + 2,
        cauplas: row["CAUPLAS"],
        valor: tipoCombustible
      });
    }
  }
  
  if (nuevosItems && String(nuevosItems).trim() !== "") {
    countI++;
    if (samplesI.length < 5) {
      samplesI.push({
        fila: index + 2,
        cauplas: row["CAUPLAS"],
        valor: nuevosItems
      });
    }
  }
});

console.log(`Columna H (TIPO DE COMBUSTIBLE):`);
console.log(`  - Filas con datos: ${countH} de ${data.length}`);
if (samplesH.length > 0) {
  console.log(`  - Ejemplos:`);
  samplesH.forEach(s => {
    console.log(`    Fila ${s.fila} (${s.cauplas}): "${s.valor}"`);
  });
} else {
  console.log(`  - No se encontraron datos en esta columna`);
}

console.log(`\nColumna I (NUEVOS ITEMS):`);
console.log(`  - Filas con datos: ${countI} de ${data.length}`);
if (samplesI.length > 0) {
  console.log(`  - Ejemplos:`);
  samplesI.forEach(s => {
    console.log(`    Fila ${s.fila} (${s.cauplas}): "${s.valor}"`);
  });
} else {
  console.log(`  - No se encontraron datos en esta columna`);
}
