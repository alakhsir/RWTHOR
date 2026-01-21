import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  RotateCw,
  Loader2,
  AlertCircle
} from 'lucide-react';

// Configure PDF.js worker to use CDN for better stability in dev/prod without complex build config
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Styles for react-pdf
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

interface PDFViewerProps {
  pdfUrl: string;
  onClose?: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl, onClose }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Security: Disable Context Menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Security: Block Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+S, Ctrl+P, Ctrl+C
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p' || e.key === 'c')) {
        e.preventDefault();
      }
      // Block Print Screen (limited support)
      if (e.key === 'PrintScreen') {
        // e.preventDefault(); // Often doesn't work, but good intent
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // PDF Loading Success
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  // PDF Loading Error
  const onDocumentLoadError = (err: Error) => {
    console.error('PDF Load Error:', err);
    setLoading(false);
    // Show actual error message to help debug (CORS vs Worker vs Corrupt)
    setError(`Failed to load document: ${err.message}`);
  };

  // Zoom Logic
  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  // Responsive Width Calculation
  const [containerWidth, setContainerWidth] = useState<number>(window.innerWidth);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width) {
          setContainerWidth(Math.floor(entry.contentRect.width));
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Custom Auto-Hide Controls Logic
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000); // Hide after 3 seconds
  }, []);

  useEffect(() => {
    // Initial timer
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [resetControlsTimeout]);

  // Handle user activity
  const handleUserActivity = () => {
    resetControlsTimeout();
  };

  return (
    <div
      className="flex flex-col h-full bg-[#1a1a1a] text-white select-none relative"
      onContextMenu={handleContextMenu}
      ref={containerRef}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      onMouseMove={handleUserActivity}
      onTouchStart={handleUserActivity}
      onClick={handleUserActivity}
    >
      {/* Close Button */}
      {onClose && (
        <div
          className={`absolute top-4 right-4 z-50 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <button onClick={onClose} className="p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors">
            <span className="sr-only">Close</span>
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-auto flex justify-center p-4 relative custom-scrollbar bg-[#0d0f12]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center">
            <AlertCircle className="text-red-500 mb-4" size={48} />
            <p className="text-lg font-medium text-red-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!error && (
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
            className="flex flex-col gap-4 items-center py-4"
          >
            {/* Render all pages with mapping */}
            {Array.from(new Array(numPages), (el, index) => (
              <div key={`page_${index + 1}`} className="shadow-2xl relative">
                <Page
                  pageNumber={index + 1}
                  scale={scale}
                  rotate={rotation}
                  width={Math.min(containerWidth - 32, 800)} // Responsive width constraint
                  renderTextLayer={false} // Disable text selection completely
                  renderAnnotationLayer={false} // Disable links/annotations
                  className="border border-gray-800 bg-white"
                  loading={
                    <div className="h-[600px] w-[400px] bg-white/5 animate-pulse flex items-center justify-center text-gray-500">
                      Loading Page {index + 1}...
                    </div>
                  }
                />
                <div className="absolute -left-12 top-0 text-xs text-gray-500 font-mono hidden xl:block">
                  {index + 1}
                </div>
              </div>
            ))}
          </Document>
        )}
      </div>

      {/* Bottom Floating Toolbar */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center gap-4 bg-[#1f2937]/90 backdrop-blur-sm border border-gray-700 px-6 py-3 rounded-full shadow-2xl transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
      >
        {/* Zoom Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={zoomOut}
            disabled={loading}
            className="p-1.5 hover:bg-white/10 rounded-full disabled:opacity-30 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={20} />
          </button>

          <span className="font-mono text-sm font-bold w-[3rem] text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={zoomIn}
            disabled={loading}
            className="p-1.5 hover:bg-white/10 rounded-full disabled:opacity-30 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={20} />
          </button>
        </div>

        <div className="w-px h-5 bg-gray-600"></div>

        {/* Rotate Control */}
        <button
          onClick={() => setRotation((prev) => (prev + 90) % 360)}
          disabled={loading}
          className="p-1.5 hover:bg-white/10 rounded-full disabled:opacity-30 transition-colors text-white"
          title="Rotate"
        >
          <RotateCw size={20} />
        </button>
      </div>

      {/* Page Count - Separate Floating Badge */}
      {!loading && showControls && (
        <div className="absolute top-4 left-4 z-50 bg-black/60 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs font-bold font-mono transition-opacity duration-300 border border-white/10">
          {numPages} Pages
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
