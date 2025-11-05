import { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Set up PDF.js worker with version matching react-pdf's internal version
const workerUrl = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

interface PDFViewerProps {
  pdfUrl: string;
  title: string;
  onClose: () => void;
  icon?: React.ReactNode;
}

export default function PDFViewer({ pdfUrl, title, onClose, icon }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom controls
  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 4));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const resetZoom = () => setScale(1);

  // Page navigation
  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages));

  // Document load handler
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToPrevPage();
      if (e.key === 'ArrowRight') goToNextPage();
      if ((e.ctrlKey && e.key === '=') || e.key === '+') {
        e.preventDefault();
        zoomIn();
      }
      if ((e.ctrlKey && e.key === '-') || e.key === '-') {
        e.preventDefault();
        zoomOut();
      }
      if (e.ctrlKey && e.key === '0') resetZoom();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages, onClose]);

  // Trackpad/pinch zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lastDistance = 0;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.001;
        setScale(prev => Math.min(Math.max(prev + delta, 0.5), 4));
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const [a, b] = e.touches;
        const dist = Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
        if (lastDistance) {
          const delta = (dist - lastDistance) / 200;
          setScale(prev => Math.min(Math.max(prev + delta, 0.5), 4));
        }
        lastDistance = dist;
      }
    };

    const resetDistance = () => (lastDistance = 0);

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', resetDistance);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', resetDistance);
    };
  }, []);

  // Pan/drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
    document.body.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !panStart || !containerRef.current) return;
    e.preventDefault();
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    containerRef.current.scrollLeft -= dx;
    containerRef.current.scrollTop -= dy;
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    document.body.style.cursor = 'default';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col select-none">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {icon && <span className="text-xl">{icon}</span>}
          <h2 className="text-lg font-medium truncate">{title}</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full" aria-label="Close">
          <X size={24} />
        </button>
      </div>

      {/* PDF Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-800"
        style={{ touchAction: 'none', WebkitOverflowScrolling: 'touch' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="flex justify-center py-4">
          <Document 
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="text-white text-center p-8">
                Loading PDF...
              </div>
            }
            error={
              <div className="text-white text-center p-8">
                Failed to load PDF. Please try again or download it.
              </div>
            }>
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              width={window.innerWidth * 0.9}
            />
          </Document>
        </div>
      </div>

      {/* Footer with controls */}
      <div className="bg-gray-900 p-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            className="p-2 text-white hover:bg-gray-700 rounded-full"
            aria-label="Zoom out"
          >
            <ZoomOut size={20} />
          </button>
          <span className="text-white text-sm w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-2 text-white hover:bg-gray-700 rounded-full"
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
              pageNumber <= 1 ? 'text-gray-500 cursor-not-allowed' : 'text-white hover:bg-gray-700'
            }`}
          >
            <ChevronLeft size={24} />
          </button>
          <span className="text-white text-sm min-w-[60px] text-center">
            {pageNumber} / {numPages || '...'}
          </span>
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className={`p-2 rounded-full ${
              pageNumber >= numPages
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