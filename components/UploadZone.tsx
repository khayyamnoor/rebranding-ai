'use client';

import { useCallback, useRef, useState } from 'react';

interface Props {
  onFile: (file: File) => void;
  fileName?: string | null;
}

export function UploadZone({ onFile, fileName }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  const isUploaded = !!fileName;

  return (
    <div
      role="button"
      tabIndex={0}
      className={[
        'upload-zone',
        'cursor-pointer',
        'flex flex-col items-center justify-center',
        'py-12 px-6 text-center',
        dragging ? 'dragging' : '',
        isUploaded ? 'uploaded' : '',
      ].join(' ')}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        className="hidden"
        onChange={handleSelect}
      />
      {isUploaded ? (
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-success text-white text-sm font-semibold"
          >
            ✓
          </span>
          <span className="font-medium">{fileName}</span>
          <span className="text-muted text-sm ml-1">— click to replace</span>
        </div>
      ) : (
        <>
          <p className="font-display italic text-xl mb-1">Drop a logo here.</p>
          <p className="text-muted text-sm">
            Or click to browse · PNG, JPG, SVG
          </p>
        </>
      )}
    </div>
  );
}
