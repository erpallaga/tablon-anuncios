import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2 } from 'lucide-react';

// Import the PDF.js worker
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set the worker source
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// iOS detection
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// Increase resolution for mobile devices
const DPI = window.devicePixelRatio * 96;

interface PDFViewerProps {
  pdfUrl: string;
  title: string;
  onClose: () => void;
  icon?: React.ReactNode;
}

export default function PDFViewer({ pdfUrl, title, onClose }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [error, setError] = useState<string>('');
  const [scale, setScale] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [touchStart, setTouchStart] = useState<number>(0);
  const [initialScale, setInitialScale] = useState<number>(1);
  // Rotation state with setter
  const [rotation, setRotation] = useState<number>(0);


  // Handle container resizing
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

  // Handle keyboard shortcuts
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
        // Rotation is handled via CSS transform
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

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setError('');
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setError(`Failed to load PDF document: ${error.message}`);
    
    // Try to open the PDF in a new tab as a fallback
    if (isIOS) {
      window.open(pdfUrl, '_blank');
    }
  };

  // Navigation
  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages));

  // Zoom controls
  const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
  const resetZoom = () => setScale(1);
  const rotate = () => setRotation(prev => (prev + 90) % 360);

  // Handle wheel event for zooming
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale(prev => Math.min(Math.max(prev + delta, 0.5), 3));
    }
  };

  // Handle touch events for pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      setTouchStart(Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      ));
      setInitialScale(scale);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      e.stopPropagation();
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      if (touchStart > 0) {
        const newScale = Math.min(Math.max(initialScale * (currentDistance / touchStart), 0.5), 3);
        setScale(newScale);
      }
    }
  };
  
  const handleTouchEnd = () => {
    setTouchStart(0);
  };

  // Calculate distance between two touch points
  const getDistance = (touch1: Touch, touch2: Touch) => {
    return Math.hypot(
      touch2.pageX - touch1.pageX,
      touch2.pageY - touch1.pageY
    );
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Calculate page width based on container and DPI
  const getPageWidth = () => {
    if (!containerRef.current) return 800; // Default width
    
    const containerWidth = containerRef.current.clientWidth - 40; // Account for padding
    const isMobile = window.innerWidth <= 768;
    const maxWidth = isFullscreen ? 1600 : 1200;
    const scaledWidth = Math.min(containerWidth, maxWidth);
    const dpiScale = isMobile ? DPI / 96 : 1;
    return Math.floor(scaledWidth * dpiScale);
  };

  const pageWidth = getPageWidth();

  // Add debug info
  console.log('PDFViewer render:', {
    pdfUrl,
    pageNumber,
    numPages,
    scale,
    rotation,
    containerWidth,
    isIOS,
    error
  });

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 p-4 transition-all duration-300 ${isFullscreen ? 'p-0' : ''}`}
      onKeyDown={(e) => e.stopPropagation()}
      style={{
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        maxHeight: isIOS ? 'var(--visual-viewport-height, 90vh)' : '90vh',
        height: isIOS ? 'var(--visual-viewport-height, 90vh)' : 'auto',
        width: '100%',
        overflow: 'hidden',
        touchAction: 'none',
        userSelect: 'none'
      }}
    >
      {/* Header with improved touch targets for mobile */}
      <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between w-full">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-medium text-gray-800">{title}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-full hover:bg-gray-200 transition-colors active:bg-gray-300"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            style={{
              WebkitTapHighlightColor: 'transparent',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button
            onClick={onClose}
            className="p-3 rounded-full hover:bg-gray-200 transition-colors active:bg-gray-300"
            aria-label="Close"
            style={{
              WebkitTapHighlightColor: 'transparent',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div 
        ref={containerRef}
        className="flex-1 w-full overflow-auto relative touch-none"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          maxHeight: isIOS ? 'calc(var(--visual-viewport-height, 100%) - 120px)' : 'calc(100vh - 180px)',
          height: isIOS ? 'calc(var(--visual-viewport-height, 100%) - 120px)' : 'calc(100vh - 180px)',
          touchAction: 'pan-y',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          padding: '1rem 0'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {error ? (
          <div className="text-red-600 text-center p-4">
            {error}
            {isIOS && (
              <div className="mt-2 text-sm text-gray-600">
                If the PDF doesn't load, try opening it in a new tab:
                <a 
                  href={pdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 underline ml-1"
                >
                  Open PDF
                </a>
              </div>
            )}
          </div>
        ) : (
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            }
            options={{
              cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
              cMapPacked: true,
              standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`, // Added trailing slash
              disableAutoFetch: false,
              disableStream: false,
              disableRange: false,
              useSystemFonts: false,
              isEvalSupported: false,
              maxImageSize: -1,
              useWorkerFetch: true,
              stopAtErrors: false,
              verbosity: 0
            }}
            onItemClick={({ dest, pageNumber, destArray }) => {
              // Handle internal PDF links
              if (dest) {
                // Handle the destination
              } else if (pageNumber) {
                setPageNumber(pageNumber);
              }
            }}
          >
            <div 
              className="relative"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: '0 0',
                width: `${100/scale}%`,
                minHeight: '100%',
                touchAction: 'pan-x pan-y',
                WebkitUserSelect: 'none',
                userSelect: 'none',
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                WebkitFontSmoothing: 'subpixel-antialiased',
                transition: 'transform 0.1s ease-out',
                margin: '0 auto'
              }}
            >
              <Page 
                pageNumber={pageNumber} 
                width={pageWidth}
                loading={
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                }
                error={
                  <div className="text-red-500 p-4 text-center">
                    Error loading page {pageNumber}. Please try again.
                  </div>
                }
                renderTextLayer={false}
                renderAnnotationLayer={false}
                onRenderError={(error) => {
                  console.error('Error rendering PDF page:', error);
                  setError(`Error rendering page: ${error.message}`);
                }}
              />
            </div>
          </Document>
        )}
      </div>

      {/* Navigation controls */}
      {!error && numPages > 0 && (
        <div className="bg-white border-t border-gray-200 p-3 sticky bottom-0 z-10 w-full">
          <div className="flex items-center justify-between max-w-2xl mx-auto w-full">
            <button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-150 active:scale-95"
              title="Previous page (Left Arrow)"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm sm:text-base">Previous</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={zoomOut}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={resetZoom}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded"
                title="Reset zoom"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                onClick={zoomIn}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={rotate}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                title="Rotate"
              >
                <RotateCw className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <button
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-150 active:scale-95"
              title="Next page (Right Arrow)"
            >
              <span className="text-sm sm:text-base">Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
