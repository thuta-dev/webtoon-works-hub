import { useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Scissors, CloudOff, Cloud } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import JSZip from 'jszip';
import { CropperSettings } from '@/components/cropper/CropperSettings';
import { ImageUploadZone } from '@/components/cropper/ImageUploadZone';
import { SlicedResults } from '@/components/cropper/SlicedResults';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { toast } from '@/hooks/use-toast';

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
  '4:5': 5 / 4,
  '6:9': 9 / 6,
};

// Predefined story names - can be extended
const STORY_OPTIONS = [
  'Story A',
  'Story B',
  'Story C',
  'My Webtoon Series',
  'The Adventures',
  'Romance Chronicles',
];

export default function Cropper() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('4:5');
  const [zipFilename, setZipFilename] = useState('sliced_images');
  const [chapterNumber, setChapterNumber] = useState('');
  const [storyName, setStoryName] = useState('');
  const [tiktokMode, setTiktokMode] = useState(false);
  const [results, setResults] = useState<SlicedResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  const { isConnected, isLoading: isDriveLoading, connect, disconnect, uploadFiles } = useGoogleDrive();

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
      toast({
        title: 'Error',
        description: 'Failed to slice images.',
        variant: 'destructive',
      });
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

  const handleExportToDrive = async () => {
    if (!storyName || !chapterNumber) {
      toast({
        title: 'Missing Information',
        description: 'Please select a story and enter a chapter number.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      await uploadFiles(
        results.map((r) => ({ name: r.name, dataUrl: r.dataUrl })),
        storyName,
        chapterNumber,
        tiktokMode,
        (progress) => setExportProgress(progress)
      );
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload Section */}
          <Card className="border-2 border-foreground bg-background" style={{ boxShadow: 'var(--shadow-hard)' }}>
            <CardHeader className="border-b-2 border-foreground">
              <CardTitle className="flex items-center justify-between text-foreground">
                <span className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Long Images
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isConnected ? disconnect : connect}
                  disabled={isDriveLoading}
                  className="border-2 border-foreground text-foreground hover:bg-muted"
                >
                  {isConnected ? (
                    <>
                      <Cloud className="w-4 h-4 mr-1 text-green-600" />
                      Connected
                    </>
                  ) : (
                    <>
                      <CloudOff className="w-4 h-4 mr-1" />
                      Connect Drive
                    </>
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <ImageUploadZone
                images={images}
                onUpload={handleFileUpload}
                onRemove={removeImage}
                onClearAll={clearAll}
              />

              <CropperSettings
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                zipFilename={zipFilename}
                setZipFilename={setZipFilename}
                chapterNumber={chapterNumber}
                setChapterNumber={setChapterNumber}
                storyName={storyName}
                setStoryName={setStoryName}
                tiktokMode={tiktokMode}
                setTiktokMode={setTiktokMode}
                storyOptions={STORY_OPTIONS}
              />

              {/* Slice Button */}
              <Button
                onClick={sliceImages}
                disabled={images.length === 0 || isProcessing}
                className="w-full border-2 border-foreground bg-foreground text-background hover:bg-foreground/90"
                style={{ boxShadow: 'var(--shadow-hard-sm)' }}
              >
                <Scissors className="w-4 h-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Slice Images'}
              </Button>

              {/* Export Progress */}
              {isExporting && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Exporting to Google Drive...</p>
                  <Progress value={exportProgress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <SlicedResults
            results={results}
            onDownloadSingle={downloadSingle}
            onDownloadAllZip={downloadAllAsZip}
            onExportToDrive={handleExportToDrive}
            isExporting={isExporting}
            isDriveConnected={isConnected}
          />
        </div>

        {/* Google Drive Setup Instructions */}
        {!isConnected && (
          <Card className="mt-6 border-2 border-foreground bg-muted/30" style={{ boxShadow: 'var(--shadow-hard)' }}>
            <CardHeader className="border-b-2 border-foreground">
              <CardTitle className="text-foreground">📋 Google Drive Setup Instructions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-sm">
              <p className="font-medium">To enable Google Drive export, follow these steps:</p>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google Cloud Console</a></li>
                <li>Create a new project or select an existing one</li>
                <li>Enable the <strong>Google Drive API</strong> in APIs & Services → Library</li>
                <li>Go to APIs & Services → Credentials → Create Credentials → OAuth Client ID</li>
                <li>Choose "Web application" as the application type</li>
                <li>Add your site URL to "Authorized JavaScript origins" (e.g., <code className="bg-muted px-1 rounded">https://your-app.lovable.app</code>)</li>
                <li>Create an API Key in Credentials → Create Credentials → API Key</li>
                <li>Provide the Client ID and API Key to the developer to integrate</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-4">
                Note: The CLIENT_ID and API_KEY need to be configured in the application code.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
