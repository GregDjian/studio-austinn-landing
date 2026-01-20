// AntiCopyImage.tsx
import React from "react";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  wrapperClassName?: string;
};

export const AntiCopyImage: React.FC<Props> = ({
  wrapperClassName = "",
  className = "",
  onContextMenu,
  draggable,
  ...props
}) => {
  return (
    <div className={`relative ${wrapperClassName}`}>
      <img
        {...props}
        className={className}
        draggable={draggable ?? false}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu?.(e);
        }}
        onDragStart={(e) => e.preventDefault()}
      />

      {/* Transparent overlay blocks easy drag/open-in-new-tab */}
      <div
        className="absolute inset-0"
        onContextMenu={(e) => e.preventDefault()}
        aria-hidden="true"
      />
    </div>
  );
};
