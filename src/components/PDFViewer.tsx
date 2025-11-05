import { useState, useRef, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

const workerUrl = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

interface PDFViewerProps {
  pdfUrl: string;
  title: string;
  onClose: () => void;
  icon?: React.ReactNode;
}

export default function PDFViewer({
  pdfUrl,
  title,
  onClose,
  icon,
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // --- Center horizontally, align top with padding ---
  const centerContent = () => {
    if (!containerRef.current || !pageSize.width || !pageSize.height) return;

    const container = containerRef.current;
    const scaledWidth = pageSize.width * scale;
    // Removed unused scaledHeight variable

    const offsetX = Math.max(0, (container.clientWidth - scaledWidth) / 2);
    const offsetY = 20; // Padding from top

    setOffset({ x: offsetX, y: offsetY });
  };

  // --- Handle drag/pan with bounds ---
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setLastPos({ x: e.clientX, y: e.clientY });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    document.body.style.cursor = "grabbing";
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;

    setLastPos({ x: e.clientX, y: e.clientY });

    setOffset((prev) => {
      if (!containerRef.current || !pageSize.width || !pageSize.height) {
        return { x: prev.x + dx, y: prev.y + dy };
      }

      const container = containerRef.current;
      const scaledWidth = pageSize.width * scale;
      const scaledHeight = pageSize.height * scale;

      let newX = prev.x + dx;
      let newY = prev.y + dy;

      // Bounds: prevent dragging outside visible area
      const minX = container.clientWidth - scaledWidth;
      const maxX = 0;
      const minY = container.clientHeight - scaledHeight;
      const maxY = 20; // Don't go higher than 20px from top

      newX = Math.min(maxX, Math.max(minX, newX));
      newY = Math.min(maxY, Math.max(minY, newY));

      return { x: newX, y: newY };
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    document.body.style.cursor = "default";
  };

  // --- Handle zoom via mouse wheel ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        setScale((prev) => Math.min(5, Math.max(0.5, prev + delta)));
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  // --- Re-center on scale or page size change ---
  useEffect(() => {
    centerContent();
  }, [scale, pageSize]);

  // --- Re-center on page change ---
  useEffect(() => {
    if (numPages > 0 && pageSize.width > 0) {
      setTimeout(centerContent, 100);
    }
  }, [pageNumber, numPages]);

  // --- PDF load success ---
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const onPageLoadSuccess = (page: any) => {
    setPageSize({ width: page.width, height: page.height });
  };

  // --- Navigation ---
  const goToPrevPage = () => setPageNumber((p) => Math.max(p - 1, 1));
  const goToNextPage = () => setPageNumber((p) => Math.min(p + 1, numPages));

  const zoomIn = () => setScale((p) => Math.min(p + 0.25, 5));
  const zoomOut = () => setScale((p) => Math.max(p - 0.25, 0.5));
  const resetZoom = () => {
    setScale(1);
    setTimeout(centerContent, 50);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col select-none">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {icon && <span className="text-xl">{icon}</span>}
          <h2 className="text-lg font-medium truncate max-w-md">{title}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          aria-label="Close"
        >
          <X size={24} />
        </button>
      </div>

      {/* PDF Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden bg-gray-800 touch-none relative"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        style={{ touchAction: "none", background: "#1a1a1a" }}
      >
        <div
          ref={contentRef}
          className="absolute"
          style={{
            left: 0,
            top: 0,
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "top left",
            transition: isDragging ? "none" : "transform 0.1s ease-out",
          }}
        >
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div className="text-white text-center p-8">Loading PDF...</div>}
            error={<div className="text-red-400 text-center p-8">Failed to load PDF.</div>}
          >
            <Page
              pageNumber={pageNumber}
              scale={1}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              onLoadSuccess={onPageLoadSuccess}
            />
          </Document>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="bg-gray-900 p-3 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut size={20} />
          </button>
          <span className="text-sm w-12 text-center font-medium">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={resetZoom}
            className="px-3 py-1 text-sm hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
            disabled={scale === 1}
          >
            Reset
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className={`p-2 rounded-full transition-colors ${
              pageNumber <= 1
                ? "text-gray-500 cursor-not-allowed"
                : "hover:bg-gray-700"
            }`}
            aria-label="Previous page"
          >
            <ChevronLeft size={24} />
          </button>
          <span className="text-sm min-w-[60px] text-center font-medium">
            {pageNumber} / {numPages || "..."}
          </span>
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className={`p-2 rounded-full transition-colors ${
              pageNumber >= numPages
                ? "text-gray-500 cursor-not-allowed"
                : "hover:bg-gray-700"
            }`}
            aria-label="Next page"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}