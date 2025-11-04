import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2 } from 'lucide-react';

// Configurar worker de PDF.js con mayor resolución
// Usar el worker estándar para todos los navegadores
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Removed unused DPI constant

interface PDFViewerProps {
  pdfUrl: string;
  title: string;
  icon: string;
  onClose: () => void;
}

export default function PDFViewer({ pdfUrl, title, icon, onClose }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [error, setError] = useState<string>('');
  const [scale, setScale] = useState<number>(1);
  // Rotación fija en 0 grados por ahora
  const rotation = 0;
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Ajustar tamaño del contenedor
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    const updateSize = () => {
      if (el) {
        const width = Math.min(el.clientWidth, 1400);
        setContainerWidth(width);
      }
    };
    
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    updateSize();
    
    return () => ro.disconnect();
  }, [isFullscreen]);

  // Manejar teclas de acceso rápido
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      } else if (e.key === '+' || (e.ctrlKey && e.key === '=')) {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-' || (e.ctrlKey && e.key === '-')) {
        e.preventDefault();
        zoomOut();
      } else if (e.key === '0' && e.ctrlKey) {
        e.preventDefault();
        resetZoom();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        // Rotación deshabilitada temporalmente
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevPage();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNextPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const preventZoom = (e: WheelEvent) => {
      // Only prevent default for wheel events that we handle (pinch/zoom)
      if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) < 1) {
        e.preventDefault();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchmove', preventDefault, { passive: false });
      container.addEventListener('wheel', preventZoom, { passive: false });
    }
    
    return () => {
      if (container) {
        container.removeEventListener('touchmove', preventDefault);
        container.removeEventListener('wheel', preventZoom);
      }
    };
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setError('');
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error al cargar PDF:', error);
    setError('No se pudo cargar el documento PDF');
  }

  // Navegación
  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages));

  // Controles de zoom con pasos más pequeños
  const ZOOM_STEP = 0.1; // Reducido de 0.2 a 0.1 para mayor precisión
  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 3;
  const ZOOM_SENSITIVITY = 0.005; // Controla la sensibilidad del zoom con rueda
  
  const zoomIn = () => setScale(prev => {
    const newScale = Math.min(prev + ZOOM_STEP, ZOOM_MAX);
    return parseFloat(newScale.toFixed(2));
  });
  
  const zoomOut = () => setScale(prev => {
    const newScale = Math.max(prev - ZOOM_STEP, ZOOM_MIN);
    return parseFloat(newScale.toFixed(2));
  });
  
  const resetZoom = () => setScale(1);
  
  // Handle mouse wheel and trackpad pinch gestures for zooming
  const handleWheel = (e: WheelEvent) => {
    // Handle both ctrl+wheel and trackpad pinch gestures
    if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) < 1) {
      e.preventDefault();
      e.stopPropagation();
      
      // For trackpad pinch, use the ctrlKey status to determine zoom direction
      const isPinch = !e.ctrlKey && !e.metaKey && Math.abs(e.deltaY) < 1 && e.deltaMode === 0;
      
      // Maximum sensitivity for trackpad pinch
      const delta = isPinch 
        ? -e.deltaY * 0.15  // Maximum sensitivity for trackpad
        : -Math.sign(e.deltaY) * ZOOM_SENSITIVITY * 3;  // High sensitivity for mouse wheel
      
      setScale(prev => {
        let newScale;
        
        if (delta > 0) {
          // Zoom in - maximum sensitivity
          newScale = prev * (1 + delta * 0.8);
        } else {
          // Zoom out - maximum sensitivity
          newScale = prev / (1 - delta * 0.8);
        }
          
        return Math.min(Math.max(newScale, ZOOM_MIN), ZOOM_MAX);
      });
    }
  };

  // Enhanced touch handling for pinch-to-zoom and smooth scrolling
  interface TouchState {
    x1: number; y1: number; x2: number; y2: number;
    distance: number;
    lastScale: number;
    lastX: number;
    lastY: number;
    touchStartTime: number;
  }
  
  const touchStartRef = useRef<TouchState | null>(null);

  const isScrollingRef = useRef(false);
  const lastTouchTimeRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    const now = Date.now();
    
    // Prevent rapid double-tap zoom on iOS
    if (now - lastTouchTimeRef.current < 300) {
      e.preventDefault();
    }
    lastTouchTimeRef.current = now;

    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.pageX - touch1.pageX,
        touch2.pageY - touch1.pageY
      );
      
      touchStartRef.current = {
        x1: touch1.pageX,
        y1: touch1.pageY,
        x2: touch2.pageX,
        y2: touch2.pageY,
        distance,
        lastScale: scale,
        lastX: (touch1.pageX + touch2.pageX) / 2,
        lastY: (touch1.pageY + touch2.pageY) / 2,
        touchStartTime: now
      };
      
      // Prevent scrolling when zooming
      isScrollingRef.current = false;
    } else if (e.touches.length === 1) {
      // Single touch - allow scrolling
      touchStartRef.current = {
        x1: e.touches[0].pageX,
        y1: e.touches[0].pageY,
        x2: 0, y2: 0,
        distance: 0,
        lastScale: scale,
        lastX: e.touches[0].pageX,
        lastY: e.touches[0].pageY,
        touchStartTime: now
      };
      isScrollingRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    // Two-finger pinch to zoom
    if (e.touches.length === 2) {
      e.preventDefault();
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.pageX - touch1.pageX,
        touch2.pageY - touch1.pageY
      );
      
      if (touchStartRef.current.distance > 0) {
        // More sensitive and fluid zoom calculation
        const scaleFactor = Math.pow(currentDistance / touchStartRef.current.distance, 2);
        const newScale = touchStartRef.current.lastScale * scaleFactor;
        
        // Apply easing for smoother zoom
        const clampedScale = Math.min(Math.max(newScale, ZOOM_MIN), ZOOM_MAX);
        const easedScale = touchStartRef.current.lastScale + (clampedScale - touchStartRef.current.lastScale) * 0.3;
        
        setScale(easedScale);
      }
      
      // Update touch positions for next move
      touchStartRef.current.x1 = touch1.pageX;
      touchStartRef.current.y1 = touch1.pageY;
      touchStartRef.current.x2 = touch2.pageX;
      touchStartRef.current.y2 = touch2.pageY;
      touchStartRef.current.distance = currentDistance;
      
    } else if (e.touches.length === 1 && isScrollingRef.current) {
      // Single finger scroll - allow default behavior for better scrolling
      return;
    } else {
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    isScrollingRef.current = false;
  };

  // La rotación está deshabilitada temporalmente para simplificar
  // const rotate = () => setRotation(prev => (prev + 90) % 360);
  
  // Pantalla completa
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  // Calcular el ancho de la página con zoom y DPI mejorado
  const getPageWidth = () => {
    if (containerWidth === 0) return undefined;
    const maxWidth = isFullscreen ? 1600 : 1200;
    // Restar el padding (4 = 1rem = 16px * 2 = 32px) para evitar desbordamiento horizontal
    const containerWidthWithPadding = containerWidth - 32;
    const baseWidth = Math.min(containerWidthWithPadding * scale, maxWidth);
    
    // Mobile detection and scaling
    const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
    const isIOSDevice = typeof navigator !== 'undefined' ? /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream : false;
  
    // Set initial scale for mobile devices
    let dpiScale = 1;
    if (isMobile && typeof window !== 'undefined') {
      const pixelRatio = window.devicePixelRatio || 1;
      const viewportScale = Math.min(window.innerWidth / 428, 1);
      
      if (isIOSDevice) {
        dpiScale = Math.min(pixelRatio * 0.5, 1.2) * viewportScale;
      } else {
        dpiScale = Math.min(pixelRatio * 0.6, 1.3) * viewportScale;
      }
      
      dpiScale = Math.max(dpiScale, 0.5);
    }
    
    return baseWidth * dpiScale;
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-0 sm:p-4 touch-none">
      <div className={`bg-white ${isFullscreen ? 'rounded-none' : 'rounded-lg'} shadow-2xl w-full h-full sm:max-w-[95vw] sm:max-h-[95vh] flex flex-col transition-all duration-300 overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-2xl sm:text-3xl flex-shrink-0">{icon}</span>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">{title}</h2>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Controles de zoom */}
            <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={zoomOut}
                className="p-1.5 rounded-md hover:bg-gray-200 transition-colors duration-150"
                aria-label="Alejar"
                title="Alejar (Ctrl + -)"
              >
                <ZoomOut className="w-4 h-4 text-gray-700" />
              </button>
              <button
                onClick={resetZoom}
                className="px-2 py-1 text-sm font-medium text-gray-700 min-w-[50px] text-center"
                title="Restablecer zoom (Ctrl + 0)"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                onClick={zoomIn}
                className="p-1.5 rounded-md hover:bg-gray-200 transition-colors duration-150"
                aria-label="Acercar"
                title="Acercar (Ctrl + +)"
              >
                <ZoomIn className="w-4 h-4 text-gray-700" />
              </button>
            </div>

            {/* Botón de rotación */}
            <button
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150 hidden sm:block opacity-50 cursor-not-allowed"
              aria-label="Rotar (deshabilitado)"
              title="Rotación deshabilitada temporalmente"
            >
              <RotateCw className="w-5 h-5 text-gray-400" />
            </button>

            {/* Botón de pantalla completa */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150 hidden sm:block"
              aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
              title={isFullscreen ? "Salir de pantalla completa (Esc)" : "Pantalla completa (F11)"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 text-gray-700" />
              ) : (
                <Maximize2 className="w-5 h-5 text-gray-700" />
              )}
            </button>

            {/* Botón de cerrar */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
              aria-label="Cerrar visor"
              title="Cerrar (Esc)"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Contenido del PDF */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto bg-gray-100 relative touch-auto"
          onWheel={handleWheel as any}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          style={{
            WebkitOverflowScrolling: 'touch' as any,
            touchAction: 'manipulation',
            WebkitTouchCallout: 'none' as any,
            WebkitUserSelect: 'none' as any,
            userSelect: 'none',
            overflow: 'auto',
            overscrollBehavior: 'contain'
          }}
        >
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
              <div>
                <p className="text-red-600 mb-4">{error}</p>
                <p className="text-gray-600 text-sm">
                  Asegúrate de que el archivo exista en la carpeta <code className="bg-gray-200 px-2 py-1 rounded">public/pdfs</code>
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full min-h-full flex flex-col items-center py-4">
              <div className="w-full max-w-full px-2 flex justify-center">
                <Document
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <div className="text-gray-600">
                      Cargando documento...
                    </div>
                  }
                >
                  <Page
                    pageNumber={pageNumber}
                    width={getPageWidth()}
                    scale={scale * (window.devicePixelRatio || 1)}
                    rotate={rotation}
                    className="shadow-lg transition-transform duration-200 my-0 max-w-full h-auto block"
                    loading={
                      <div className="text-gray-600">
                        Cargando página...
                      </div>
                    }
                    renderMode="canvas"
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    onRenderError={(error) => {
                      console.error('Error al renderizar el PDF:', error);
                      setError('Error al mostrar el documento. Por favor, inténtalo de nuevo.');
                    }}
                    onRenderSuccess={(page) => {
                      // Mejorar la calidad de renderizado
                      const viewport = page.getViewport({ scale: scale * (window.devicePixelRatio || 1) });
                      const canvas = document.querySelector('.react-pdf__Page__canvas') as HTMLCanvasElement | null;
                      if (canvas) {
                        canvas.style.width = `${Math.floor(viewport.width)}px`;
                        canvas.style.height = `${Math.floor(viewport.height)}px`;
                      }
                    }}
                  />
                </Document>
              </div>
            </div>
          )}
        </div>

        {/* Controles de navegación */}
        {!error && numPages > 0 && (
          <div className="bg-white border-t border-gray-200 p-2 sm:p-3 sticky bottom-0 z-10">
            <div className="flex items-center justify-between max-w-2xl mx-auto w-full">
              <button
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-150 active:scale-95"
                title="Página anterior (Flecha izquierda)"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Anterior</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-medium text-gray-700">
                  Página {pageNumber} de {numPages}
                </span>
              </div>

              <button
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-150 active:scale-95"
                title="Siguiente página (Flecha derecha)"
              >
                <span className="text-sm sm:text-base">Siguiente</span>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
