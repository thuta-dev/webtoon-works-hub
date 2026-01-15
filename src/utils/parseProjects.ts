import { ParsedProject } from '@/types/webtoon';

export function parseProjectInput(input: string): ParsedProject[] {
  if (!input.trim()) return [];

  const lines = input.split('\n').filter(line => line.trim());
  const projects: ParsedProject[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Skip "Total" summary lines
    if (/^total\s*[-:]/i.test(trimmedLine)) continue;

    let projectName = '';
    let numbersString = '';

    // Format 1: "Project Name - 1 / 2 / 3 /" (dash separator with slashes)
    const dashMatch = trimmedLine.match(/^(.+?)\s*[-–—]\s*(.*)$/);
    
    if (dashMatch) {
      projectName = dashMatch[1].trim();
      numbersString = dashMatch[2];
    } else {
      // Format 2: "Project Name 1, 2, 3" or "Project Name 1 2 3" (no dash)
      const spaceMatch = trimmedLine.match(/^(.+?)\s+([\d,\s\/\-]+)$/);
      if (spaceMatch) {
        projectName = spaceMatch[1].trim();
        numbersString = spaceMatch[2];
      } else {
        // No numbers found, treat whole line as project with count 1
        projectName = trimmedLine;
      }
    }

    if (!projectName) continue;

    // Extract all numbers - handle slashes, commas, spaces as separators
    const numbers = numbersString
      .split(/[,\/\s]+/)
      .map(n => n.trim())
      .filter(n => n && /^\d+$/.test(n))
      .map(n => parseInt(n, 10))
      .filter(n => !isNaN(n));

    // Check if this project already exists (case-insensitive)
    const existingIndex = projects.findIndex(
      p => p.name.toLowerCase() === projectName.toLowerCase()
    );

    if (numbers.length > 0) {
      if (existingIndex >= 0) {
        const existing = projects[existingIndex];
        const allChapters = [...new Set([...existing.chapters, ...numbers])].sort((a, b) => a - b);
        projects[existingIndex] = {
          ...existing,
          chapters: allChapters,
          count: allChapters.length,
        };
      } else {
        projects.push({
          name: projectName,
          chapters: [...new Set(numbers)].sort((a, b) => a - b),
          count: numbers.length,
        });
      }
    } else if (existingIndex < 0 && projectName) {
      // Project name only, no numbers
      projects.push({
        name: projectName,
        chapters: [],
        count: 1,
      });
    }
  }

  return projects.sort((a, b) => a.name.localeCompare(b.name));
}
