import { useState, useEffect, useRef } from "react";

interface LazyImageProps {
  src: string;
  alt?: string;
  className?: string;
  placeholder?: React.ReactNode;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

/**
 * Intersection Observer를 사용한 이미지 lazy loading
 */
export function LazyImage({
  src,
  alt = "",
  className = "",
  placeholder,
  onError,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "50px", // 뷰포트 50px 전에 미리 로드
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && placeholder && (
        <div className="absolute inset-0 animate-pulse bg-gray-200 flex items-center justify-center">
          {placeholder}
        </div>
      )}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`${className} ${
            isLoaded ? "opacity-100" : "opacity-0"
          } transition-opacity duration-300`}
          onLoad={() => setIsLoaded(true)}
          onError={onError}
          loading="lazy"
        />
      )}
    </div>
  );
}
