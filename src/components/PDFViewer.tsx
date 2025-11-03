import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2 } from 'lucide-react';

// Configurar worker de PDF.js con mayor resolución
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Aumentar la resolución para dispositivos móviles
const DPI = window.devicePixelRatio * 96; // Ajustar según la densidad de píxeles del dispositivo

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
  const [rotation, setRotation] = useState<number>(0);
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
        rotate();
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
  
  // Manejar rueda del ratón para hacer zoom con mayor suavidad
  const zoomRef = useRef<number>(1);
  const [isZooming, setIsZooming] = useState(false);
  
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      
      // Usar requestAnimationFrame para suavizar la animación
      if (!isZooming) {
        setIsZooming(true);
        
        // Calcular el nuevo zoom basado en la dirección del scroll
        const delta = -e.deltaY * ZOOM_SENSITIVITY;
        zoomRef.current = Math.min(Math.max(zoomRef.current + delta, ZOOM_MIN), ZOOM_MAX);
        
        // Actualizar el estado con el nuevo zoom
        setScale(prev => {
          const newScale = Math.min(Math.max(prev + delta, ZOOM_MIN), ZOOM_MAX);
          return parseFloat(newScale.toFixed(2));
        });
        
        // Permitir el siguiente evento de zoom
        requestAnimationFrame(() => {
          setIsZooming(false);
        });
      }
    }
  };
  const rotate = () => setRotation(prev => (prev + 90) % 360);
  
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
    const baseWidth = Math.min(containerWidth * scale, maxWidth);
    
    // Aplicar factor de escala basado en DPI para dispositivos móviles
    const isMobile = window.innerWidth <= 768;
    const dpiScale = isMobile ? DPI / 96 : 1; // Aumentar escala en móviles
    
    return baseWidth * dpiScale;
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-0 sm:p-4">
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
              onClick={rotate}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150 hidden sm:block"
              aria-label="Rotar"
              title="Rotar (R)"
            >
              <RotateCw className="w-5 h-5 text-gray-700" />
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
          className="flex-1 overflow-auto bg-gray-100 relative flex items-center justify-center"
          onWheel={handleWheel}
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
            <div className="w-full h-full overflow-auto flex items-center justify-center">
              <div className="p-4">
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
                    scale={scale * (window.devicePixelRatio || 1)}
                    width={getPageWidth()}
                    rotate={rotation}
                    className="shadow-lg transition-transform duration-200 mx-auto"
                    renderMode="canvas"
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={
                      <div className="text-gray-600">
                        Cargando página...
                      </div>
                    }
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
