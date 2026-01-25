import React, { ReactNode } from 'react';

interface ViewContainerProps {
    children: ReactNode;
    /** Se true, centraliza o conteúdo vertical e horizontalmente */
    centered?: boolean;
    /** Classe adicional para casos específicos */
    className?: string;
}

/**
 * Componente padrão para container de views.
 * Centraliza altura fixa, scroll e estilos visuais.
 * 
 * Para alterar a altura de todas as views, modifique VIEW_HEIGHT aqui.
 */

// Altura padrão de todas as views - ALTERE AQUI PARA MUDANÇA GLOBAL
const VIEW_HEIGHT = 'h-[520px]';

// Classes base para todas as views
const BASE_CLASSES = `w-full animate-fade-in overflow-y-auto overflow-x-hidden custom-scrollbar landscape-content`;

export const ViewContainer: React.FC<ViewContainerProps> = ({
    children,
    centered = false,
    className = ''
}) => {
    const centeredClasses = centered ? 'flex flex-col items-center justify-center' : '';

    return (
        <div className={`${BASE_CLASSES} ${VIEW_HEIGHT} ${centeredClasses} ${className}`.trim()}>
            {children}
        </div>
    );
};

// Export das constantes para uso externo se necessário
export const VIEW_STYLES = {
    height: VIEW_HEIGHT,
    baseClasses: BASE_CLASSES,
};
