import { useState, useRef, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface PDFViewerProps {
  pdfUrl: string;
  title: string;
  onClose: () => void;
  icon?: string | React.ReactNode;
  initialPage?: number;
  totalPages?: number;
}

export default function PDFViewer({ 
  pdfUrl, 
  title, 
  onClose, 
  icon, 
  initialPage = 1, 
  totalPages: externalTotalPages 
}: PDFViewerProps) {
  const [scale, setScale] = useState<number>(1);
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const hasPageCount = externalTotalPages !== undefined;
  
  // Zoom levels for better control
  const ZOOM_LEVELS = [0.5, 0.75, 1, 1.5, 2, 3];
  const [currentZoomIndex, setCurrentZoomIndex] = useState(ZOOM_LEVELS.indexOf(1));
  
  // Navigation callbacks with useCallback
  const scrollToTop = useCallback(() => {
    pdfContainerRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' });
  }, []);

  const goToPrevPage = useCallback(() => {
    setPageNumber(prev => {
      const newPage = Math.max(prev - 1, 1);
      if (newPage !== prev) scrollToTop();
      return newPage;
    });
  }, [scrollToTop]);

  const goToNextPage = useCallback(() => {
    setPageNumber(prev => {
      if (hasPageCount && prev >= externalTotalPages!) return prev;
      const newPage = prev + 1;
      scrollToTop();
      return newPage;
    });
  }, [hasPageCount, externalTotalPages, scrollToTop]);
  
  // Handle keyboard navigation and zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToPrevPage();
      if (e.key === 'ArrowRight') goToNextPage();
      if (e.key === '0' && e.ctrlKey) {
        e.preventDefault();
        resetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goToPrevPage, goToNextPage, pageNumber, hasPageCount, externalTotalPages]);


  // Zoom controls with discrete levels
  const zoomIn = () => {
    setCurrentZoomIndex(prev => {
      const newIndex = Math.min(prev + 1, ZOOM_LEVELS.length - 1);
      setScale(ZOOM_LEVELS[newIndex]);
      return newIndex;
    });
  };

  const zoomOut = () => {
    setCurrentZoomIndex(prev => {
      const newIndex = Math.max(prev - 1, 0);
      setScale(ZOOM_LEVELS[newIndex]);
      return newIndex;
    });
  };

  const resetZoom = () => {
    const defaultIndex = ZOOM_LEVELS.indexOf(1);
    setCurrentZoomIndex(defaultIndex);
    setScale(1);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {icon && (
            typeof icon === 'string' ? (
              <span className="text-xl mr-2">{icon}</span>
            ) : (
              <span className="text-xl mr-2">{icon}</span>
            )
          )}
          <h2 className="text-lg font-medium truncate">{title}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-700 rounded-full"
          aria-label="Close"
        >
          <X size={24} />
        </button>
      </div>

      {/* PDF Container */}
      <div 
        ref={pdfContainerRef}
        className="flex-1 overflow-auto bg-gray-800"
        style={{
          touchAction: 'pan-y pinch-zoom',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        <div className="min-h-full flex flex-col items-center p-2 sm:p-4">
          <div 
            className="bg-white shadow-lg max-w-full"
            style={{
              width: 'fit-content',
              margin: '0 auto',
              transform: 'translateZ(0)', // Force GPU acceleration
            }}
          >
            <object
              data={`${pdfUrl}#page=${pageNumber}&zoom=${Math.round(scale * 100)}&view=FitH`}
              type="application/pdf"
              className="block w-full h-full min-h-[80vh]"
              onLoad={() => {
                // Set focus for keyboard navigation
                const obj = document.querySelector('object');
                if (obj) obj.focus();
              }}
              onError={(e) => {
                console.error('Error loading PDF:', e);
              }}
            >
              <div className="text-white p-4 text-center">
                <p>Unable to display PDF. Please download it instead:</p>
                <a 
                  href={pdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 underline mt-2 inline-block"
                >
                  Open PDF in new tab
                </a>
              </div>
            </object>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={currentZoomIndex === 0}
            className={`p-2 rounded-full ${
              currentZoomIndex === 0 
                ? 'text-gray-500 cursor-not-allowed' 
                : 'text-white hover:bg-gray-700'
            }`}
            aria-label="Zoom out"
          >
            <ZoomOut size={20} />
          </button>
          <span className="text-white text-sm w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={currentZoomIndex === ZOOM_LEVELS.length - 1}
            className={`p-2 rounded-full ${
              currentZoomIndex === ZOOM_LEVELS.length - 1 
                ? 'text-gray-500 cursor-not-allowed' 
                : 'text-white hover:bg-gray-700'
            }`}
            aria-label="Zoom in"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={resetZoom}
            className="px-3 py-1 text-white hover:bg-gray-700 rounded text-sm"
            disabled={scale === 1}
          >
            Reset
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className={`p-2 rounded-full ${
              pageNumber <= 1
                ? 'text-gray-500 cursor-not-allowed'
                : 'text-white hover:bg-gray-700'
            }`}
          >
            <ChevronLeft size={24} />
          </button>
          <span className="text-white text-sm min-w-[60px] text-center">
            {pageNumber} {hasPageCount ? ` / ${externalTotalPages}` : ''}
          </span>
          <button
            onClick={goToNextPage}
            disabled={hasPageCount ? pageNumber >= (externalTotalPages ?? 1) : false}
            className={`p-2 rounded-full ${
              hasPageCount && pageNumber >= (externalTotalPages ?? 1)
                ? 'text-gray-500 cursor-not-allowed' 
                : 'text-white hover:bg-gray-700'
            }`}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
