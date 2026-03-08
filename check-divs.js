const fs = require('fs');
const filepath = 'c:/Users/ET/Documents/GitHub/Violet - Cauplas/Violet v3/src/modules/inventory/pages/ProductsPage.tsx';
const code = fs.readFileSync(filepath, 'utf8');
const openCount = (code.match(/<div/g) || []).length;
const closeCount = (code.match(/<\/div>/g) || []).length;
console.log('div open:', openCount, 'div close:', closeCount);

const lines = code.split('\n');
console.log("Lines 990-1030:");
for(let i=989; i<1035; i++){
  console.log((i+1) + ": " + lines[i]);
}
