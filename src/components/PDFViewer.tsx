import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ZoomIn, ZoomOut, RotateCw } from "lucide-react";

// PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  pdfUrl: string;
  title: string;
  icon?: React.ReactNode;
  onClose: () => void;
}

export default function PDFViewer({ pdfUrl, title, icon, onClose }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);

  // ✅ Center PDF after first render
  useEffect(() => {
    if (!containerRef.current || !pageSize.width || !pageSize.height) return;

    const container = containerRef.current;
    const x = (container.clientWidth - pageSize.width * scale) / 2;
    const y = (container.clientHeight - pageSize.height * scale) / 2;
    setOffset({ x, y });
  }, [pageSize, scale]);

  // Handle load success
  const onDocumentLoadSuccess = () => {
    // No need to track numPages in state since we're only showing one page
  };

  // Measure page size
  const onPageLoadSuccess = (page: any) => {
    const viewport = page.getViewport({ scale: 1 });
    setPageSize({ width: viewport.width, height: viewport.height });
  };

  // --- Pinch to Zoom ---
  const lastDistance = useRef<number | null>(null);
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (lastDistance.current) {
        const delta = distance - lastDistance.current;
        setScale((prev) => Math.min(5, Math.max(0.5, prev + delta * 0.002)));
      }
      lastDistance.current = distance;
    } else if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      const newX = touch.clientX - lastPos.x;
      const newY = touch.clientY - lastPos.y;
      updateOffset(newX, newY);
    }
  };

  const handleTouchEnd = () => {
    lastDistance.current = null;
    setIsDragging(false);
  };

  // --- Handle drag/pan (mouse & touch unified) ---
  const updateOffset = (x: number, y: number) => {
    if (!containerRef.current || !pageSize.width || !pageSize.height) {
      setOffset({ x, y });
      return;
    }

    const container = containerRef.current;
    const scaledWidth = pageSize.width * scale;
    const scaledHeight = pageSize.height * scale;

    const minX = container.clientWidth - scaledWidth;
    const maxX = 0;
    const minY = container.clientHeight - scaledHeight;
    const maxY = 0;

    setOffset({
      x: Math.min(maxX, Math.max(minX, x)),
      y: Math.min(maxY, Math.max(minY, y)),
    });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setLastPos({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    document.body.style.cursor = "grabbing";
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - lastPos.x;
    const newY = e.clientY - lastPos.y;
    updateOffset(newX, newY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    document.body.style.cursor = "default";
  };

  // --- Wheel Zoom (trackpad or mouse) ---
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      setScale((prev) => Math.min(5, Math.max(0.5, prev + delta)));
    }
  };

  return (
    <div className="relative w-full h-screen bg-neutral-900 overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gray-900 text-white p-4 flex justify-between items-center z-20">
        <div className="flex items-center gap-2">
          {icon && <span className="text-xl">{icon}</span>}
          <h2 className="text-lg font-medium">{title}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Toolbar */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 flex gap-3 z-20 bg-black/50 p-2 rounded-xl backdrop-blur">
        <button
          onClick={() => setScale((s) => Math.min(5, s + 0.2))}
          className="text-white"
        >
          <ZoomIn size={22} />
        </button>
        <button
          onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
          className="text-white"
        >
          <ZoomOut size={22} />
        </button>
        <button
          onClick={() => setRotation((r) => (r + 90) % 360)}
          className="text-white"
        >
          <RotateCw size={22} />
        </button>
      </div>

      {/* PDF Container */}
      <div
        ref={containerRef}
        className="w-full h-full relative touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            const touch = e.touches[0];
            setIsDragging(true);
            setLastPos({
              x: touch.clientX - offset.x,
              y: touch.clientY - offset.y,
            });
          }
        }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <div
          className="absolute transition-transform duration-75 will-change-transform"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transformOrigin: "top left",
          }}
        >
          <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
            <Page
              pageNumber={1}
              onLoadSuccess={onPageLoadSuccess}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        </div>
      </div>
    </div>
  );
}
