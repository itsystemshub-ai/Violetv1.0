/**
 * Import Worker - Procesa importaciones de productos en background
 * 
 * Evita bloquear el UI thread durante importaciones masivas
 */

// Procesar productos en lotes
const processBatch = (products, batchSize = 100) => {
  const batches = [];
  for (let i = 0; i < products.length; i += batchSize) {
    batches.push(products.slice(i, i + batchSize));
  }
  return batches;
};

// Validar producto
const validateProduct = (product) => {
  const errors = [];
  
  if (!product.CAUPLAS) {
    errors.push('CAUPLAS es requerido');
  }
  
  if (!product.NOMBRE) {
    errors.push('NOMBRE es requerido');
  }
  
  if (product.PRECIO && isNaN(parseFloat(product.PRECIO))) {
    errors.push('PRECIO debe ser un número');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    product
  };
};

// Limpiar datos del producto
const cleanProduct = (product) => {
  return {
    ...product,
    CAUPLAS: String(product.CAUPLAS || '').trim(),
    NOMBRE: String(product.NOMBRE || '').trim(),
    PRECIO: parseFloat(product.PRECIO) || 0,
    CANTIDAD: parseInt(product.CANTIDAD) || 0,
    // Agregar más limpieza según necesidad
  };
};

// Escuchar mensajes del thread principal
self.addEventListener('message', async (event) => {
  const { type, data, id } = event.data;
  
  try {
    switch (type) {
      case 'VALIDATE_PRODUCTS': {
        const { products } = data;
        
        // Enviar progreso
        self.postMessage({
          type: 'PROGRESS',
          id,
          data: { current: 0, total: products.length, message: 'Iniciando validación...' }
        });
        
        const results = products.map((product, index) => {
          // Enviar progreso cada 100 productos
          if (index % 100 === 0) {
            self.postMessage({
              type: 'PROGRESS',
              id,
              data: { 
                current: index, 
                total: products.length, 
                message: `Validando producto ${index + 1}/${products.length}...` 
              }
            });
          }
          
          return validateProduct(product);
        });
        
        const valid = results.filter(r => r.isValid);
        const invalid = results.filter(r => !r.isValid);
        
        self.postMessage({
          type: 'VALIDATE_COMPLETE',
          id,
          data: { valid, invalid, total: products.length }
        });
        break;
      }
      
      case 'CLEAN_PRODUCTS': {
        const { products } = data;
        
        self.postMessage({
          type: 'PROGRESS',
          id,
          data: { current: 0, total: products.length, message: 'Limpiando datos...' }
        });
        
        const cleaned = products.map((product, index) => {
          if (index % 100 === 0) {
            self.postMessage({
              type: 'PROGRESS',
              id,
              data: { 
                current: index, 
                total: products.length, 
                message: `Limpiando producto ${index + 1}/${products.length}...` 
              }
            });
          }
          
          return cleanProduct(product);
        });
        
        self.postMessage({
          type: 'CLEAN_COMPLETE',
          id,
          data: { products: cleaned }
        });
        break;
      }
      
      case 'PROCESS_BATCH': {
        const { products, batchSize } = data;
        
        const batches = processBatch(products, batchSize);
        
        self.postMessage({
          type: 'BATCH_COMPLETE',
          id,
          data: { batches, totalBatches: batches.length }
        });
        break;
      }
      
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      id,
      data: { message: error.message, stack: error.stack }
    });
  }
});

// Indicar que el worker está listo
self.postMessage({ type: 'READY' });
