import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const EPSILON = 0.001;

const useScaleToFit = ({ stageRef, contentRef, observeVisualViewport = true }) => {
  const [scale, setScale] = useState(1);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const rafRef = useRef(null);

  const measure = () => {
    const stageEl = stageRef.current;
    const contentEl = contentRef.current;
    if (!stageEl || !contentEl) {
      return;
    }

    const availableWidth = stageEl.clientWidth;
    const availableHeight = stageEl.clientHeight;
    const naturalWidth = contentEl.offsetWidth;
    const naturalHeight = contentEl.offsetHeight;

    if (availableWidth <= 0 || availableHeight <= 0 || naturalWidth <= 0 || naturalHeight <= 0) {
      return;
    }

    const widthScale = availableWidth / naturalWidth;
    const heightScale = availableHeight / naturalHeight;
    const nextScale = Math.min(1, widthScale, heightScale);

    setScale((previousScale) =>
      Math.abs(previousScale - nextScale) > EPSILON ? nextScale : previousScale
    );

    setNaturalSize((previousSize) => {
      if (
        Math.abs(previousSize.width - naturalWidth) <= EPSILON &&
        Math.abs(previousSize.height - naturalHeight) <= EPSILON
      ) {
        return previousSize;
      }

      return { width: naturalWidth, height: naturalHeight };
    });
  };

  const scheduleMeasure = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(measure);
  };

  useIsomorphicLayoutEffect(() => {
    scheduleMeasure();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(scheduleMeasure) : null;

    if (resizeObserver && stageRef.current) {
      resizeObserver.observe(stageRef.current);
    }

    if (resizeObserver && contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    window.addEventListener('resize', scheduleMeasure);
    window.addEventListener('orientationchange', scheduleMeasure);

    const visualViewport =
      observeVisualViewport && window.visualViewport ? window.visualViewport : null;

    if (visualViewport) {
      visualViewport.addEventListener('resize', scheduleMeasure);
      visualViewport.addEventListener('scroll', scheduleMeasure);
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      if (resizeObserver) {
        resizeObserver.disconnect();
      }

      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('orientationchange', scheduleMeasure);

      if (visualViewport) {
        visualViewport.removeEventListener('resize', scheduleMeasure);
        visualViewport.removeEventListener('scroll', scheduleMeasure);
      }
    };
  }, [contentRef, observeVisualViewport, stageRef]);

  return {
    scale,
    naturalWidth: naturalSize.width,
    naturalHeight: naturalSize.height
  };
};

export default useScaleToFit;
