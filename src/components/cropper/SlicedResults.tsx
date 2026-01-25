import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Scissors, Download, Upload } from 'lucide-react';

interface SlicedResult {
  dataUrl: string;
  name: string;
}

interface SlicedResultsProps {
  results: SlicedResult[];
  onDownloadSingle: (result: SlicedResult) => void;
  onDownloadAllZip: () => void;
  onExportToDrive: () => void;
  isExporting: boolean;
  isDriveConnected: boolean;
}

export function SlicedResults({
  results,
  onDownloadSingle,
  onDownloadAllZip,
  onExportToDrive,
  isExporting,
  isDriveConnected,
}: SlicedResultsProps) {
  return (
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
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm font-medium text-foreground">{results.length} slices created</span>
              <div className="flex-1" />
              <Button
                onClick={onDownloadAllZip}
                variant="outline"
                className="border-2 border-foreground text-foreground hover:bg-muted"
                style={{ boxShadow: 'var(--shadow-hard-sm)' }}
              >
                <Package className="w-4 h-4 mr-2" />
                Download ZIP
              </Button>
              <Button
                onClick={onExportToDrive}
                disabled={isExporting || !isDriveConnected}
                className="border-2 border-foreground bg-foreground text-background hover:bg-foreground/90"
                style={{ boxShadow: 'var(--shadow-hard-sm)' }}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export to Google Drive'}
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
                      onClick={() => onDownloadSingle(result)}
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
  );
}
