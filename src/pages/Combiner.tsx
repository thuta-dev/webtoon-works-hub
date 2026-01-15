import { useState, useRef, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, Trash2, Image as ImageIcon, Package } from 'lucide-react';
import JSZip from 'jszip';

interface UploadedImage {
  file: File;
  url: string;
  name: string;
}

interface CombinedResult {
  dataUrl: string;
  name: string;
}

export default function Combiner() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [splitCount, setSplitCount] = useState(1);
  const [zipFilename, setZipFilename] = useState('combined_images');
  const [results, setResults] = useState<CombinedResult[]>([]);
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

  const combineImages = async () => {
    if (images.length === 0) return;

    setIsProcessing(true);
    setResults([]);

    try {
      // Load all images
      const loadedImages = await Promise.all(
        images.map((img) => {
          return new Promise<HTMLImageElement>((resolve, reject) => {
            const imgEl = new window.Image();
            imgEl.onload = () => resolve(imgEl);
            imgEl.onerror = reject;
            imgEl.src = img.url;
          });
        })
      );

      // Split images into chunks
      const chunkSize = Math.ceil(loadedImages.length / splitCount);
      const chunks: HTMLImageElement[][] = [];
      
      for (let i = 0; i < loadedImages.length; i += chunkSize) {
        chunks.push(loadedImages.slice(i, i + chunkSize));
      }

      // Create combined images for each chunk
      const newResults: CombinedResult[] = [];

      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];
        const maxWidth = Math.max(...chunk.map((img) => img.width));
        const totalHeight = chunk.reduce((sum, img) => sum + img.height, 0);

        const canvas = document.createElement('canvas');
        canvas.width = maxWidth;
        canvas.height = totalHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, maxWidth, totalHeight);

        let currentY = 0;
        for (const img of chunk) {
          const x = (maxWidth - img.width) / 2;
          ctx.drawImage(img, x, currentY);
          currentY += img.height;
        }

        const dataUrl = canvas.toDataURL('image/png');
        newResults.push({
          dataUrl,
          name: splitCount > 1 ? `combined_part_${chunkIndex + 1}.png` : 'combined.png',
        });
      }

      setResults(newResults);
    } catch (error) {
      console.error('Error combining images:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSingle = (result: CombinedResult) => {
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
                Upload Images
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
                <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-foreground font-medium">Drop images here or click to upload</p>
                <p className="text-sm text-muted-foreground mt-1">Images will be sorted alphanumerically</p>
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
                  <Label htmlFor="splitCount" className="text-foreground font-medium">Split Output Count</Label>
                  <Input
                    id="splitCount"
                    type="number"
                    min={1}
                    max={images.length || 1}
                    value={splitCount}
                    onChange={(e) => setSplitCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="border-2 border-foreground bg-background text-foreground"
                    style={{ boxShadow: 'var(--shadow-hard-sm)' }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipFilename" className="text-foreground font-medium">Zip Filename</Label>
                  <Input
                    id="zipFilename"
                    value={zipFilename}
                    onChange={(e) => setZipFilename(e.target.value)}
                    placeholder="combined_images"
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

              {/* Combine Button */}
              <Button
                onClick={combineImages}
                disabled={images.length === 0 || isProcessing}
                className="w-full border-2 border-foreground bg-foreground text-background hover:bg-foreground/90"
                style={{ boxShadow: 'var(--shadow-hard-sm)' }}
              >
                {isProcessing ? 'Processing...' : 'Combine Images'}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="border-2 border-foreground bg-background" style={{ boxShadow: 'var(--shadow-hard)' }}>
            <CardHeader className="border-b-2 border-foreground">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Package className="w-5 h-5" />
                Results
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {results.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Combined images will appear here</p>
                </div>
              ) : (
                <>
                  <div className="grid gap-4">
                    {results.map((result, index) => (
                      <div key={index} className="border-2 border-foreground p-3" style={{ boxShadow: 'var(--shadow-hard-sm)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-foreground">{result.name}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadSingle(result)}
                            className="border-2 border-foreground text-foreground hover:bg-muted"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </div>
                        <img
                          src={result.dataUrl}
                          alt={result.name}
                          className="max-h-48 w-auto mx-auto border border-foreground"
                        />
                      </div>
                    ))}
                  </div>
                  
                  {results.length > 1 && (
                    <Button
                      onClick={downloadAllAsZip}
                      className="w-full border-2 border-foreground bg-foreground text-background hover:bg-foreground/90"
                      style={{ boxShadow: 'var(--shadow-hard-sm)' }}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Download All as ZIP
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
