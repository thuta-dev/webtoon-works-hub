import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

type AspectRatio = '4:5' | '6:9';

interface CropperSettingsProps {
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  zipFilename: string;
  setZipFilename: (name: string) => void;
  chapterNumber: string;
  setChapterNumber: (chapter: string) => void;
  storyName: string;
  setStoryName: (name: string) => void;
  tiktokMode: boolean;
  setTiktokMode: (enabled: boolean) => void;
  storyOptions: string[];
}

export function CropperSettings({
  aspectRatio,
  setAspectRatio,
  zipFilename,
  setZipFilename,
  chapterNumber,
  setChapterNumber,
  storyName,
  setStoryName,
  tiktokMode,
  setTiktokMode,
  storyOptions,
}: CropperSettingsProps) {
  return (
    <div className="grid gap-4">
      {/* Row 1: Story Name & Chapter Number */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="storyName" className="text-foreground font-medium">Story Name</Label>
          <Select value={storyName} onValueChange={setStoryName}>
            <SelectTrigger 
              className="border-2 border-foreground bg-background text-foreground"
              style={{ boxShadow: 'var(--shadow-hard-sm)' }}
            >
              <SelectValue placeholder="Select story" />
            </SelectTrigger>
            <SelectContent className="border-2 border-foreground bg-background">
              {storyOptions.map((story) => (
                <SelectItem key={story} value={story}>{story}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="chapterNumber" className="text-foreground font-medium">Chapter Number</Label>
          <Input
            id="chapterNumber"
            type="text"
            value={chapterNumber}
            onChange={(e) => setChapterNumber(e.target.value)}
            placeholder="e.g., 01, 02, 10"
            className="border-2 border-foreground bg-background text-foreground"
            style={{ boxShadow: 'var(--shadow-hard-sm)' }}
          />
        </div>
      </div>

      {/* Row 2: Aspect Ratio & Zip Filename */}
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

      {/* Row 3: TikTok Mode Toggle */}
      <div className="flex items-center justify-between p-3 border-2 border-foreground bg-muted/30" style={{ boxShadow: 'var(--shadow-hard-sm)' }}>
        <div className="space-y-0.5">
          <Label htmlFor="tiktokMode" className="text-foreground font-medium">TikTok Mode</Label>
          <p className="text-xs text-muted-foreground">Split images into groups of 35 (Part 1, Part 2, etc.)</p>
        </div>
        <Switch
          id="tiktokMode"
          checked={tiktokMode}
          onCheckedChange={setTiktokMode}
        />
      </div>
    </div>
  );
}
