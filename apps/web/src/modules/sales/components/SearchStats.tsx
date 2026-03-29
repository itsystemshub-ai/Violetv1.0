/**
 * SearchStats - Estadísticas de búsqueda en tiempo real
 * Muestra términos más buscados y sugerencias inteligentes
 */

import React from 'react';
import { TrendingUp, Clock, Search, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/core/shared/utils/utils';

interface SearchStatsProps {
  topSearches: string[];
  recentSearches: string[];
  onSearchClick: (query: string) => void;
  className?: string;
}

export const SearchStats: React.FC<SearchStatsProps> = ({
  topSearches,
  recentSearches,
  onSearchClick,
  className,
}) => {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)}>
      {/* Búsquedas más frecuentes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Más Buscados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topSearches.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {topSearches.map((query, index) => (
                <button
                  key={index}
                  onClick={() => onSearchClick(query)}
                  className="group"
                >
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <BarChart3 className="h-3 w-3 mr-1" />
                    {query}
                  </Badge>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay búsquedas frecuentes aún
            </p>
          )}
        </CardContent>
      </Card>

      {/* Búsquedas recientes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Búsquedas Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentSearches.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((query, index) => (
                <button
                  key={index}
                  onClick={() => onSearchClick(query)}
                  className="group"
                >
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-accent transition-colors"
                  >
                    <Search className="h-3 w-3 mr-1" />
                    {query}
                  </Badge>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay búsquedas recientes
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * SearchStatsCompact - Versión compacta para mostrar en el POS
 */
export const SearchStatsCompact: React.FC<{
  topSearches: string[];
  onSearchClick: (query: string) => void;
  className?: string;
}> = ({ topSearches, onSearchClick, className }) => {
  if (topSearches.length === 0) return null;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <TrendingUp className="h-3 w-3" />
        Popular:
      </span>
      <div className="flex flex-wrap gap-1">
        {topSearches.slice(0, 3).map((query, index) => (
          <button
            key={index}
            onClick={() => onSearchClick(query)}
            className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {query}
          </button>
        ))}
      </div>
    </div>
  );
};
