import React from "react";
import { motion } from "framer-motion";
import { Plus, ShoppingCart, Info, Package, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/index";
import { IMAGES } from "@/assets/images";

interface Product {
  id: string;
  name: string;
  descripcionManguera?: string;
  category: string;
  price: number;
  precioFCA?: number;
  cauplas?: string;
  images?: string[];
  isNuevo?: boolean;
}

interface ProductCardProps {
  product: Product;
  onAdd: (product: any) => void;
}

export const ProductGalleryCard: React.FC<ProductCardProps> = React.memo(({ product, onAdd }) => {
  const price = product.precioFCA || product.price;
  const displayName = product.descripcionManguera || product.name || "Producto sin nombre";
  const mainImage = (product.images && product.images.length > 0) ? product.images[0] : IMAGES.PRODUCT_PLACEHOLDER;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative flex flex-col h-full bg-card border border-border/40 hover:border-primary/40 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted/20">
        <img
          src={mainImage}
          alt={displayName}
          className="w-full h-full object-contain mix-blend-multiply opacity-90 group-hover:scale-110 transition-transform duration-500 p-6"
        />
        
        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isNuevo && (
            <Badge className="bg-amber-500 text-white border-none text-[8px] font-black uppercase italic tracking-widest px-2 py-0.5 shadow-lg">
              <Star className="w-2.5 h-2.5 mr-1 fill-white" /> Nuevo
            </Badge>
          )}
          <Badge variant="outline" className="bg-background/80 backdrop-blur-md border-border/60 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5">
            {product.category}
          </Badge>
        </div>

        {/* Action Overlay */}
        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
           <Button 
            size="icon" 
            variant="secondary" 
            className="rounded-full h-10 w-10 shadow-lg scale-90 group-hover:scale-100 transition-transform"
            onClick={() => onAdd(product)}
           >
             <ShoppingCart className="w-5 h-5 text-primary" />
           </Button>
           <Button 
            size="icon" 
            variant="secondary" 
            className="rounded-full h-10 w-10 shadow-lg scale-90 group-hover:scale-100 transition-transform delay-75"
           >
             <Info className="w-5 h-5 text-muted-foreground" />
           </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-2">
          <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded italic">
            CAUPLAS: {product.cauplas || "---"}
          </span>
        </div>
        <h4 className="font-bold text-xs line-clamp-2 uppercase italic text-foreground/80 leading-tight mb-4 min-h-[2.5rem]">
          {displayName}
        </h4>
        
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/40">
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase text-muted-foreground/50 tracking-widest leading-none mb-1">Precio FCA</span>
            <span className="text-lg font-black italic tracking-tighter text-primary">
              {formatCurrency(price, "USD")}
            </span>
          </div>
          <Button 
            size="icon" 
            className="h-10 w-10 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all"
            onClick={() => onAdd(product)}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

export const ProductListRow: React.FC<ProductCardProps> = React.memo(({ product, onAdd }) => {
  const price = product.precioFCA || product.price;
  const displayName = product.descripcionManguera || product.name || "Producto sin nombre";
  const mainImage = (product.images && product.images.length > 0) ? product.images[0] : IMAGES.PRODUCT_PLACEHOLDER;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="group flex items-center gap-4 bg-card border border-border/40 hover:border-primary/40 rounded-2xl p-2 pr-6 shadow-sm hover:shadow-md transition-all"
    >
      {/* Thumbnail */}
      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted/20 shrink-0">
        <img
          src={mainImage}
          alt=""
          className="w-full h-full object-contain mix-blend-multiply opacity-80"
        />
      </div>

      {/* Main Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-[9px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded italic whitespace-nowrap">
            {product.cauplas || "---"}
          </span>
          <Badge variant="ghost" className="h-4 text-[7px] font-bold uppercase text-muted-foreground/60 p-0 hover:bg-transparent">
            {product.category}
          </Badge>
        </div>
        <h4 className="font-bold text-[11px] truncate uppercase italic text-foreground/80 leading-none">
          {displayName}
        </h4>
      </div>

      {/* Price Section */}
      <div className="text-right px-6">
        <p className="text-[7px] font-black text-muted-foreground uppercase leading-none mb-1 opacity-50 tracking-widest">Precio Unit</p>
        <p className="text-sm font-black text-primary/80 italic">{formatCurrency(price, "USD")}</p>
      </div>

      {/* Action */}
      <Button 
        size="icon" 
        variant="ghost" 
        className="h-10 w-10 rounded-xl hover:bg-primary hover:text-primary-foreground group-hover:scale-110 active:scale-95 transition-all"
        onClick={() => onAdd(product)}
      >
        <Plus className="w-4 h-4" />
      </Button>
    </motion.div>
  );
});
