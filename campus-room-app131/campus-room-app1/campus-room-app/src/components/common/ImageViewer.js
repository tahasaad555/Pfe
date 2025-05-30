import React, { useState, useEffect } from 'react';
import LocalImage from './LocalImage';

/**
 * Component to display an image with a clickable preview that opens a larger view
 */
const ImageViewer = ({
  src,
  alt = 'Image',
  previewStyle = {},
  previewClassName = '',
  fallbackSrc = '/images/classrooms/classroom-default.jpg',
  maxWidth = '90vw',
  maxHeight = '80vh'
}) => {
  const [showLargeView, setShowLargeView] = useState(false);
  
  // Add body scroll lock when modal is open
  useEffect(() => {
    if (showLargeView) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, [showLargeView]);
  
  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        setShowLargeView(false);
      }
    };
    
    if (showLargeView) {
      document.addEventListener('keydown', handleEsc, false);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc, false);
    };
  }, [showLargeView]);
  
  const openLargeView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowLargeView(true);
  };
  
  const closeLargeView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowLargeView(false);
  };
  
  // Prevent clicks inside the large view from closing it
  const handleContentClick = (e) => {
    e.stopPropagation();
  };
  
  return (
    <>
      {/* Preview (clickable thumbnail) */}
      <div 
        className={`image-viewer-preview ${previewClassName}`}
        style={{
          position: 'relative',
          cursor: 'pointer',
          borderRadius: '12px',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '2px solid #e5e7eb',
          ...previewStyle
        }}
        onClick={openLargeView}
        title="Click to enlarge"
      >
        <LocalImage
          src={src}
          alt={alt}
          fallbackSrc={fallbackSrc}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            cursor: 'pointer',
            display: 'block'
          }}
        />
        <div 
          className="zoom-icon"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            opacity: '0',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            pointerEvents: 'none'
          }}
        >
          🔍
        </div>
      </div>
      
      {/* Large view (modal) - Using portal-like approach */}
      {showLargeView && (
        <div 
          className="image-viewer-overlay-fixed"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '24px',
            cursor: 'pointer',
            opacity: showLargeView ? 1 : 0,
            visibility: showLargeView ? 'visible' : 'hidden',
            transition: 'all 0.3s ease-out'
          }}
          onClick={closeLargeView}
        >
          {/* Close button */}
          <div 
            className="image-viewer-close-fixed"
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              width: '50px',
              height: '50px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              zIndex: 10000,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
            onClick={closeLargeView}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            ×
          </div>
          
          {/* Image content */}
          <div 
            className="image-viewer-content-fixed"
            style={{
              position: 'relative',
              maxWidth: maxWidth,
              maxHeight: maxHeight,
              cursor: 'default',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              background: '#ffffff',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              opacity: showLargeView ? 1 : 0,
              transform: showLargeView ? 'scale(1)' : 'scale(0.8)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onClick={handleContentClick}
          >
            <LocalImage
              src={src}
              alt={alt}
              fallbackSrc={fallbackSrc}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%', 
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                display: 'block',
                borderRadius: '24px'
              }}
            />
          </div>
          
          {/* Instructions */}
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '12px',
              fontSize: '14px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              opacity: '0.8'
            }}
          >
            Click outside or press ESC to close
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{
        __html: `
          .image-viewer-preview:hover .zoom-icon {
            opacity: 1 !important;
            transform: translate(-50%, -50%) scale(1.1) !important;
          }
          
          .image-viewer-preview:hover {
            transform: scale(1.02) !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
            border-color: #3b82f6 !important;
          }
          
          @media (max-width: 768px) {
            .image-viewer-overlay-fixed {
              padding: 16px !important;
            }
            
            .image-viewer-close-fixed {
              top: 16px !important;
              right: 16px !important;
              width: 44px !important;
              height: 44px !important;
              font-size: 20px !important;
            }
            
            .image-viewer-content-fixed {
              max-width: 95vw !important;
              max-height: 90vh !important;
            }
          }
        `
      }} />
    </>
  );
};

export default ImageViewer;