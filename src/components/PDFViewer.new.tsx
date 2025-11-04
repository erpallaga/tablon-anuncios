import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2 } from 'lucide-react';

// Import the PDF.js worker as a module
import * as pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs';

// Set the worker source to the imported worker
pdfjs.GlobalWorkerOptions.workerPort = new Worker(URL.createObjectURL(
  new Blob([pdfjsWorker as any], { type: 'application/javascript' })
));

// iOS detection
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// Increase resolution for mobile devices
const DPI = window.devicePixelRatio * 96;

interface PDFViewerProps {
  pdfUrl: string;
  title: string;
  icon: string;
  onClose: () => void;
}

export default function PDFViewer({ pdfUrl, title, onClose }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [error, setError] = useState<string>('');
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Adjust container size
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
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF document');
  }

  // Navigation
  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages));

  // Zoom controls with smaller steps
  const ZOOM_STEP = 0.1;
  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 3;
  const ZOOM_SENSITIVITY = 0.005;
  
  const zoomIn = () => setScale(prev => {
    const newScale = Math.min(prev + ZOOM_STEP, ZOOM_MAX);
    return parseFloat(newScale.toFixed(2));
  });
  
  const zoomOut = () => setScale(prev => {
    const newScale = Math.max(prev - ZOOM_STEP, ZOOM_MIN);
    return parseFloat(newScale.toFixed(2));
  });
  
  const resetZoom = () => setScale(1);
  
  // Handle both mouse wheel and touch events for zooming
  const zoomRef = useRef<number>(1);
  const [isZooming, setIsZooming] = useState(false);
  const touchStartDistance = useRef<number>(0);
  
  // Handle mouse wheel for zooming
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      if (!isZooming) {
        setIsZooming(true);
        
        const delta = -e.deltaY * ZOOM_SENSITIVITY;
        updateZoom(delta);
        
        requestAnimationFrame(() => {
          setIsZooming(false);
        });
      }
    }
  };

  // Handle touch events for pinch-to-zoom on iOS
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      touchStartDistance.current = getDistance(
        e.touches[0].clientX, e.touches[0].clientY,
        e.touches[1].clientX, e.touches[1].clientY
      );
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      
      const distance = getDistance(
        e.touches[0].clientX, e.touches[0].clientY,
        e.touches[1].clientX, e.touches[1].clientY
      );
      
      const delta = (distance - touchStartDistance.current) * 0.01;
      updateZoom(delta);
      
      touchStartDistance.current = distance;
    }
  };
  
  const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.hypot(x2 - x1, y2 - y1);
  };
  
  const updateZoom = (delta: number) => {
    zoomRef.current = Math.min(Math.max(zoomRef.current + delta, ZOOM_MIN), ZOOM_MAX);
    
    setScale(prev => {
      const newScale = Math.min(Math.max(prev + delta, ZOOM_MIN), ZOOM_MAX);
      return parseFloat(newScale.toFixed(2));
    });
  };

  const rotate = () => setRotation(prev => (prev + 90) % 360);
  
  // Handle fullscreen with iOS compatibility
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        const element = containerRef.current;
        if (!element) return;
        
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) { // For iOS Safari
          await (element as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) { // For iOS Safari
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
      // Fallback for iOS which has limited fullscreen support
      if (isIOS && containerRef.current) {
        const element = containerRef.current;
        element.style.position = isFullscreen ? '' : 'fixed';
        element.style.top = isFullscreen ? '' : '0';
        element.style.left = isFullscreen ? '' : '0';
        element.style.width = isFullscreen ? '' : '100%';
        element.style.height = isFullscreen ? '' : '100%';
        element.style.zIndex = isFullscreen ? '' : '50';
        element.style.overflow = isFullscreen ? '' : 'auto';
        setIsFullscreen(!isFullscreen);
      }
    }
  };

  // Calculate page width with zoom and improved DPI
  const getPageWidth = () => {
    if (containerWidth === 0) return undefined;
    const maxWidth = isFullscreen ? 1600 : 1200;
    const baseWidth = Math.min(containerWidth * scale, maxWidth);
    
    // Apply DPI scale factor for mobile devices
    const isMobile = window.innerWidth <= 768;
    const dpiScale = isMobile ? DPI / 96 : 1;
    
    return baseWidth * dpiScale;
  };

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 p-4 transition-all duration-300 ${isFullscreen ? 'p-0' : ''}`}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onKeyDown={(e) => e.stopPropagation()}
      style={{
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        touchAction: 'pan-x pan-y',
      }}
    >
      <div 
        className="relative w-full max-w-6xl bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col"
        style={{
          maxHeight: isIOS ? 'var(--visual-viewport-height, 90vh)' : '90vh',
          height: isIOS ? 'var(--visual-viewport-height, 90vh)' : 'auto'
        }}
      >
        {/* Header with improved touch targets for mobile */}
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
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
          className="flex-1 overflow-auto p-4 flex flex-col items-center"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            maxHeight: isIOS ? 'calc(var(--visual-viewport-height, 100%) - 120px)' : '100%',
            height: isIOS ? 'calc(var(--visual-viewport-height, 100%) - 120px)' : 'auto'
          }}
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
              file={{
                url: pdfUrl,
                httpHeaders: {
                  'Accept-Ranges': 'bytes',
                  'Cache-Control': 'no-cache',
                },
                withCredentials: false
              }}
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
                standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts`,
                disableAutoFetch: true,
                disableStream: false,
                disableRange: false,
                useSystemFonts: false,
                isEvalSupported: false,
                useOnlyCssZoom: isIOS,
                maxImageSize: -1,
                disableFontFace: false,
                disableCreateObjectURL: false,
                useWorkerFetch: true,
                stopAtErrors: false,
                maxCanvasPixels: 16777216,
                verbosity: 0
              }}
            >
              <div 
                className="shadow-md"
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'center',
                  width: `${100/scale}%`,
                  height: `${100/scale}%`,
                  touchAction: 'pan-x pan-y',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                  willChange: 'transform',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  WebkitFontSmoothing: 'subpixel-antialiased'
                }}
              >
                <Page 
                  pageNumber={pageNumber} 
                  width={Math.min(containerWidth * 0.9, 1200)}
                  rotate={rotation}
                  renderTextLayer={!isIOS}
                  renderAnnotationLayer={false}
                  loading={
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  }
                  renderMode={isIOS ? 'canvas' : 'canvas'}
                  renderInteractiveForms={false}
                  customTextRenderer={false}
                  imageResourcesPath=""
                  externalLinkTarget="_blank"
                />
              </div>
            </Document>
          )}
        </div>

        {/* Navigation controls */}
        {!error && numPages > 0 && (
          <div className="bg-white border-t border-gray-200 p-3 sticky bottom-0 z-10">
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
    </div>
  );
}
