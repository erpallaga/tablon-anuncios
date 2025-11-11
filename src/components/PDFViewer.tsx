import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ZoomIn, ZoomOut, RotateCw } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

interface PDFViewerProps {
  pdfUrl: string;
  title: string;
  icon?: React.ReactNode;
  onClose: () => void;
}

export default function PDFViewer({ pdfUrl, title, icon, onClose }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number>();
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const lastDistance = useRef<number | null>(null);
  const [rotation, setRotation] = useState(0);

  const updateOffset = (x: number, y: number) => setOffset({ x, y });

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey) {
      // pinch gesture on trackpad
      setScale((prev) => Math.min(5, Math.max(0.5, prev - e.deltaY * 0.0015)));
    } else {
      // scroll and pan
      updateOffset(offset.x - e.deltaX, offset.y - e.deltaY);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, [offset]);

  // Center PDF on load
  const handleDocumentLoad = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      updateOffset(rect.width / 2, rect.height / 2);
    }
  };

  // --- Touch Handling (pinch + pan) ---
  const touchStartOffset = useRef({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      touchStartOffset.current = { x: offset.x, y: offset.y };
      setLastPos({ x: touch.clientX, y: touch.clientY });
    } else if (e.touches.length === 2) {
      lastDistance.current = null;
    }
  };

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
      const dx = touch.clientX - lastPos.x;
      const dy = touch.clientY - lastPos.y;
      updateOffset(touchStartOffset.current.x + dx, touchStartOffset.current.y + dy);
    }
  };

  const handleTouchEnd = () => {
    lastDistance.current = null;
    setIsDragging(false);
  };

  return (
    <div className="relative w-full h-screen bg-gray-950 overflow-hidden touch-none select-none">
      {/* Toolbar - fixed and outside the transform */}
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between bg-gray-900/90 text-white p-4">
          <div className="flex items-center gap-2">
            {icon && <span className="text-xl">{icon}</span>}
            <h2 className="text-lg font-medium">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setScale((s) => Math.min(5, s * 1.2))}
              className="p-1 hover:bg-gray-700 rounded"
              aria-label="Zoom in"
            >
              <ZoomIn size={20} />
            </button>
            <button 
              onClick={() => setScale((s) => Math.max(0.5, s / 1.2))}
              className="p-1 hover:bg-gray-700 rounded"
              aria-label="Zoom out"
            >
              <ZoomOut size={20} />
            </button>
            <button 
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-1 hover:bg-gray-700 rounded"
              aria-label="Rotate"
            >
              <RotateCw size={20} />
            </button>
            <button 
              onClick={onClose}
              className="ml-2 p-1 hover:bg-gray-700 rounded"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

      {/* PDF Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden flex items-center justify-center"
        style={{
          touchAction: "none",
        }}
        onMouseDown={(e) => {
          setIsDragging(true);
          setLastPos({ x: e.clientX, y: e.clientY });
        }}
        onMouseMove={(e) => {
          if (!isDragging) return;
          const dx = e.clientX - lastPos.x;
          const dy = e.clientY - lastPos.y;
          setLastPos({ x: e.clientX, y: e.clientY });
          updateOffset(offset.x + dx, offset.y + dy);
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transformOrigin: "center center", // <--- crucial fix
            transition: isDragging ? "none" : "transform 0.05s linear",
          }}
        >
          <Document file={pdfUrl} onLoadSuccess={handleDocumentLoad}>
            {Array.from(new Array(numPages), (_, i) => (
              <Page key={i + 1} pageNumber={i + 1} renderAnnotationLayer={false} renderTextLayer={false} />
            ))}
          </Document>
        </div>
      </div>
    </div>
  );
}
