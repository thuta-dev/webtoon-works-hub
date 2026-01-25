import { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Scissors, Trash2 } from 'lucide-react';

interface UploadedImage {
  file: File;
  url: string;
  name: string;
}

interface ImageUploadZoneProps {
  images: UploadedImage[];
  onUpload: (files: FileList | null) => void;
  onRemove: (index: number) => void;
  onClearAll: () => void;
}

export function ImageUploadZone({ images, onUpload, onRemove, onClearAll }: ImageUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    onUpload(e.dataTransfer.files);
  }, [onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className="border-2 border-dashed border-foreground p-8 text-center cursor-pointer hover:bg-muted transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <Scissors className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-foreground font-medium">Drop long images here or click to upload</p>
        <p className="text-sm text-muted-foreground mt-1">Images will be sliced based on aspect ratio</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => onUpload(e.target.files)}
        />
      </div>

      {/* Image List */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{images.length} images uploaded</span>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="border-2 border-foreground text-foreground hover:bg-muted"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          </div>
          <div className="max-h-48 overflow-y-auto border-2 border-foreground p-2 space-y-1">
            {images.map((img, index) => (
              <div key={index} className="flex items-center justify-between py-1 px-2 hover:bg-muted">
                <span className="text-sm text-foreground truncate flex-1">{img.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(index)}
                  className="text-foreground hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
