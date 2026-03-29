import React, { memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Product } from '@/lib';
import { Card } from "@/shared/components/ui/card";

/**
 * Lista virtualizada de productos para mejorar rendimiento
 * Solo renderiza los elementos visibles en pantalla
 */

interface VirtualizedProductListProps {
  products: Product[];
  height?: number;
  itemHeight?: number;
  onProductClick?: (product: Product) => void;
}

// Memoizar el componente de fila para evitar re-renders innecesarios
const ProductRow = memo(({ 
  product, 
  style, 
  onClick 
}: { 
  product: Product; 
  style: React.CSSProperties;
  onClick?: (product: Product) => void;
}) => {
  return (
    <div style={style} className="px-2">
      <Card 
        className="p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onClick?.(product)}
      >
        <div className="flex items-center gap-4">
          {product.images && product.images[0] && (
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="w-12 h-12 object-cover rounded"
              loading="lazy"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{product.name}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {product.description}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-primary">
              ${product.price.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">
              Stock: {product.stock}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
});

ProductRow.displayName = 'ProductRow';

export const VirtualizedProductList = memo(({
  products,
  height = 600,
  itemHeight = 100,
  onProductClick,
}: VirtualizedProductListProps) => {
  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No hay productos para mostrar
      </div>
    );
  }

  return (
    <List
      height={height}
      itemCount={products.length}
      itemSize={itemHeight}
      width="100%"
      className="scrollbar-thin"
    >
      {({ index, style }) => (
        <ProductRow
          product={products[index]}
          style={style}
          onClick={onProductClick}
        />
      )}
    </List>
  );
});

VirtualizedProductList.displayName = 'VirtualizedProductList';
