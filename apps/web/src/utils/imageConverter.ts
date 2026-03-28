/**
 * Utilidad para convertir rutas de archivo a base64
 * Carga imágenes desde URLs y las convierte a base64
 */

export const convertImagePathToBase64 = async (imagePath: string): Promise<string | null> => {
  try {
    // Si ya es base64, retornar tal cual
    if (imagePath.startsWith('data:image/')) {
      return imagePath;
    }

    // Si es una ruta de archivo, intentar cargarla
    if (imagePath.startsWith('/') || imagePath.includes('mangueras/')) {
      // Extraer el nombre del archivo
      const fileName = imagePath.split('/').pop();
      if (!fileName) return null;

      // Construir la URL completa
      const imageUrl = `/mangueras/${fileName}`;

      // Cargar la imagen
      const response = await fetch(imageUrl);
      if (!response.ok) {
        console.error(`Error cargando imagen: ${imageUrl}`);
        return null;
      }

      // Convertir a blob
      const blob = await response.blob();

      // Convertir blob a base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    // Si es una URL http/https, cargarla y convertir
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      const response = await fetch(imagePath);
      if (!response.ok) return null;

      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    return null;
  } catch (error) {
    console.error('Error convirtiendo imagen:', error);
    return null;
  }
};

export const convertAllImagesToBase64 = async (images: string[]): Promise<string[]> => {
  const convertedImages: string[] = [];

  for (const image of images) {
    const converted = await convertImagePathToBase64(image);
    if (converted) {
      convertedImages.push(converted);
    }
  }

  return convertedImages;
};

export const isValidBase64Image = (str: string): boolean => {
  if (!str || typeof str !== 'string') return false;
  
  // Verificar que empiece con data:image/
  if (!str.startsWith('data:image/')) return false;
  
  // Verificar que tenga contenido después de la coma
  const parts = str.split(',');
  if (parts.length !== 2) return false;
  
  const base64Content = parts[1];
  if (!base64Content || base64Content.length < 10) return false;
  
  return true;
};

export const filterValidImages = (images: string[] | undefined): string[] => {
  if (!images || images.length === 0) return [];
  
  return images.filter(img => {
    // Verificar que no sea null, undefined o string vacío
    if (!img || img.trim() === '') return false;
    
    // Si es base64 válido, aceptar
    if (isValidBase64Image(img)) return true;
    
    // Si es URL http/https, aceptar
    if (img.startsWith('http://') || img.startsWith('https://')) return true;
    
    // Si es blob URL, aceptar
    if (img.startsWith('blob:')) return true;
    
    // Si es ruta de archivo, intentar convertir a URL relativa
    if (img.startsWith('/mangueras/') || img.includes('mangueras/')) {
      return true; // Será convertida después
    }
    
    return false;
  });
};
