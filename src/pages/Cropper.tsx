import { useState, useRef, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Download, Trash2, Scissors, Image as ImageIcon, Package } from 'lucide-react';
import JSZip from 'jszip';

interface UploadedImage {
  file: File;
  url: string;
  name: string;
}

interface SlicedResult {
  dataUrl: string;
  name: string;
}

type AspectRatio = '4:5' | '6:9';

const ASPECT_RATIOS: Record<AspectRatio, number> = {
  '4:5': 5 / 4,  // height = width * 1.25
  '6:9': 9 / 6,  // height = width * 1.5
};

export default function Cropper() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('4:5');
  const [zipFilename, setZipFilename] = useState('sliced_images');
  const [results, setResults] = useState<SlicedResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;

    const newImages: UploadedImage[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        newImages.push({
          file,
          url: URL.createObjectURL(file),
          name: file.name,
        });
      }
    });

    setImages((prev) => [...prev, ...newImages].sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true })
    ));
    setResults([]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].url);
      newImages.splice(index, 1);
      return newImages;
    });
    setResults([]);
  };

  const clearAll = () => {
    images.forEach((img) => URL.revokeObjectURL(img.url));
    setImages([]);
    setResults([]);
  };

  const sliceImages = async () => {
    if (images.length === 0) return;

    setIsProcessing(true);
    setResults([]);

    try {
      const newResults: SlicedResult[] = [];
      const ratio = ASPECT_RATIOS[aspectRatio];

      for (let imgIndex = 0; imgIndex < images.length; imgIndex++) {
        const img = images[imgIndex];
        
        // Load the image
        const imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new window.Image();
          el.onload = () => resolve(el);
          el.onerror = reject;
          el.src = img.url;
        });

        const width = imgEl.width;
        const sliceHeight = Math.floor(width * ratio);
        const totalHeight = imgEl.height;
        const sliceCount = Math.ceil(totalHeight / sliceHeight);

        // Get base name without extension
        const baseName = img.name.replace(/\.[^/.]+$/, '');

        for (let i = 0; i < sliceCount; i++) {
          const canvas = document.createElement('canvas');
          const startY = i * sliceHeight;
          const actualHeight = Math.min(sliceHeight, totalHeight - startY);

          canvas.width = width;
          canvas.height = actualHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, actualHeight);

          ctx.drawImage(
            imgEl,
            0, startY, width, actualHeight,
            0, 0, width, actualHeight
          );

          const dataUrl = canvas.toDataURL('image/png');
          newResults.push({
            dataUrl,
            name: `${baseName}_slice_${String(i + 1).padStart(3, '0')}.png`,
          });
        }
      }

      setResults(newResults);
    } catch (error) {
      console.error('Error slicing images:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSingle = (result: SlicedResult) => {
    const link = document.createElement('a');
    link.href = result.dataUrl;
    link.download = result.name;
    link.click();
  };

  const downloadAllAsZip = async () => {
    if (results.length === 0) return;

    const zip = new JSZip();

    for (const result of results) {
      const base64Data = result.dataUrl.split(',')[1];
      zip.file(result.name, base64Data, { base64: true });
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${zipFilename}.zip`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload Section */}
          <Card className="border-2 border-foreground bg-background" style={{ boxShadow: 'var(--shadow-hard)' }}>
            <CardHeader className="border-b-2 border-foreground">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Upload className="w-5 h-5" />
                Upload Long Images
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
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
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </div>

              {/* Settings */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="aspectRatio" className="text-foreground font-medium">Aspect Ratio</Label>
                  <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as AspectRatio)}>
                    <SelectTrigger 
                      className="border-2 border-foreground bg-background text-foreground"
                      style={{ boxShadow: 'var(--shadow-hard-sm)' }}
                    >
                      <SelectValue placeholder="Select ratio" />
                    </SelectTrigger>
                    <SelectContent className="border-2 border-foreground bg-background">
                      <SelectItem value="4:5">4:5 (Instagram Portrait)</SelectItem>
                      <SelectItem value="6:9">6:9 (Taller)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipFilename" className="text-foreground font-medium">Zip Filename</Label>
                  <Input
                    id="zipFilename"
                    value={zipFilename}
                    onChange={(e) => setZipFilename(e.target.value)}
                    placeholder="sliced_images"
                    className="border-2 border-foreground bg-background text-foreground"
                    style={{ boxShadow: 'var(--shadow-hard-sm)' }}
                  />
                </div>
              </div>

              {/* Image List */}
              {images.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{images.length} images uploaded</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAll}
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
                          onClick={() => removeImage(index)}
                          className="text-foreground hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Slice Button */}
              <Button
                onClick={sliceImages}
                disabled={images.length === 0 || isProcessing}
                className="w-full border-2 border-foreground bg-foreground text-background hover:bg-foreground/90"
                style={{ boxShadow: 'var(--shadow-hard-sm)' }}
              >
                {isProcessing ? 'Processing...' : 'Slice Images'}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="border-2 border-foreground bg-background" style={{ boxShadow: 'var(--shadow-hard)' }}>
            <CardHeader className="border-b-2 border-foreground">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Package className="w-5 h-5" />
                Sliced Results
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {results.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Scissors className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Sliced images will appear here</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-foreground">{results.length} slices created</span>
                    <Button
                      onClick={downloadAllAsZip}
                      className="border-2 border-foreground bg-foreground text-background hover:bg-foreground/90"
                      style={{ boxShadow: 'var(--shadow-hard-sm)' }}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Download All as ZIP
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
                    {results.map((result, index) => (
                      <div 
                        key={index} 
                        className="border-2 border-foreground p-2 group relative" 
                        style={{ boxShadow: 'var(--shadow-hard-sm)' }}
                      >
                        <img
                          src={result.dataUrl}
                          alt={result.name}
                          className="w-full h-auto"
                        />
                        <div className="absolute inset-0 bg-foreground/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadSingle(result)}
                            className="border-2 border-background bg-background text-foreground hover:bg-muted"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{result.name}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
