import { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

const workerUrl = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

interface PDFViewerProps {
  pdfUrl: string;
  title: string;
  onClose: () => void;
  icon?: React.ReactNode;
}

export default function PDFViewer({ pdfUrl, title, onClose, icon }: PDFViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // --- Handle smooth trackpad + pinch zoom ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lastDistance = 0;
    let startScale = scale;
    let pinchMidpoint = { x: 0, y: 0 };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.002;
        const newScale = Math.min(Math.max(scale + delta, 0.5), 4);

        const rect = container.getBoundingClientRect();
        const cx = e.clientX - rect.left + container.scrollLeft;
        const cy = e.clientY - rect.top + container.scrollTop;
        const ratio = newScale / scale;

        container.scrollLeft = cx * ratio - (e.clientX - rect.left);
        container.scrollTop = cy * ratio - (e.clientY - rect.top);
        setScale(newScale);
      }
    };

    const getDistance = (touches: TouchList) =>
      Math.hypot(
        touches[0].pageX - touches[1].pageX,
        touches[0].pageY - touches[1].pageY
      );

    const getMidpoint = (touches: TouchList) => ({
      x: (touches[0].pageX + touches[1].pageX) / 2,
      y: (touches[0].pageY + touches[1].pageY) / 2,
    });

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        lastDistance = getDistance(e.touches);
        startScale = scale;

        const rect = container.getBoundingClientRect();
        const mid = getMidpoint(e.touches);
        pinchMidpoint = {
          x: mid.x - rect.left + container.scrollLeft,
          y: mid.y - rect.top + container.scrollTop,
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      e.preventDefault();

      const dist = getDistance(e.touches);
      if (!lastDistance) {
        lastDistance = dist;
        return;
      }

      const deltaScale = dist / lastDistance;
      const newScale = Math.min(Math.max(startScale * deltaScale, 0.5), 4);
      const ratio = newScale / scale;

      const rect = container.getBoundingClientRect();
      container.scrollLeft = pinchMidpoint.x * ratio - rect.width / 2;
      container.scrollTop = pinchMidpoint.y * ratio - rect.height / 2;

      // apply scale smoothly via CSS transform
      setScale(newScale);
    };

    const handleTouchEnd = () => {
      lastDistance = 0;
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [scale]);

  // --- Pan / drag ---
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

  // --- PDF loading & navigation ---
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages));

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 4));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const resetZoom = () => setScale(1);

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
        <div
          ref={contentRef}
          className="flex justify-center py-4 transition-transform duration-50 ease-linear"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div className="text-white text-center p-8">Loading PDF...</div>}
            error={<div className="text-white text-center p-8">Failed to load PDF.</div>}
          >
            <Page
              pageNumber={pageNumber}
              scale={1}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              width={window.innerWidth * 0.9}
            />
          </Document>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="bg-gray-900 p-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button onClick={zoomOut} className="p-2 text-white hover:bg-gray-700 rounded-full">
            <ZoomOut size={20} />
          </button>
          <span className="text-white text-sm w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button onClick={zoomIn} className="p-2 text-white hover:bg-gray-700 rounded-full">
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