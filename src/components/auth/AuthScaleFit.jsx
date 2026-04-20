import React, { useMemo, useRef } from 'react';
import useScaleToFit from './useScaleToFit';

const AuthScaleFit = ({ children, className = '' }) => {
  const stageRef = useRef(null);
  const contentRef = useRef(null);

  const { scale, naturalWidth, naturalHeight } = useScaleToFit({
    stageRef,
    contentRef,
    observeVisualViewport: true
  });

  const frameStyle = useMemo(() => {
    if (naturalWidth <= 0 || naturalHeight <= 0) {
      return undefined;
    }

    return {
      width: `${naturalWidth * scale}px`,
      height: `${naturalHeight * scale}px`
    };
  }, [naturalHeight, naturalWidth, scale]);

  const contentStyle = useMemo(
    () => ({
      transform: `scale(${scale})`
    }),
    [scale]
  );

  const stageClassName = className ? `auth-scale-stage ${className}` : 'auth-scale-stage';

  return (
    <div className={stageClassName} ref={stageRef}>
      <div className="auth-scale-frame" style={frameStyle}>
        <div className="auth-scale-content" ref={contentRef} style={contentStyle}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthScaleFit;
