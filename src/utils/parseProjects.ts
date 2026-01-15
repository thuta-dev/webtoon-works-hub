import { ParsedProject } from '@/types/webtoon';

export function parseProjectInput(input: string): ParsedProject[] {
  if (!input.trim()) return [];

  const lines = input.split('\n').filter(line => line.trim());
  const projects: ParsedProject[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Match pattern: "Project Name" followed by numbers
    // Handles formats like:
    // "Eleceed 137, 138, 139"
    // "IRL Quest 50"
    // "Solo Leveling 100 101 102"
    // "Tower of God Ep. 1, 2, 3"
    
    // Find where numbers start
    const match = trimmedLine.match(/^(.+?)\s+([\d,\s\-]+)$/);
    
    if (match) {
      const projectName = match[1].trim();
      const numbersString = match[2];
      
      // Extract all numbers from the string
      const numbers = numbersString
        .split(/[,\s]+/)
        .map(n => n.trim())
        .filter(n => n)
        .map(n => {
          // Handle ranges like "1-5"
          if (n.includes('-')) {
            const [start, end] = n.split('-').map(Number);
            if (!isNaN(start) && !isNaN(end) && start <= end) {
              return Array.from({ length: end - start + 1 }, (_, i) => start + i);
            }
          }
          return parseInt(n, 10);
        })
        .flat()
        .filter(n => !isNaN(n));

      if (projectName && numbers.length > 0) {
        // Check if this project already exists
        const existingIndex = projects.findIndex(
          p => p.name.toLowerCase() === projectName.toLowerCase()
        );

        if (existingIndex >= 0) {
          // Merge chapters
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
      }
    } else {
      // If no numbers found, treat the whole line as a project with count 1
      // This handles single entries like just "Eleceed"
      const projectName = trimmedLine;
      if (projectName) {
        const existingIndex = projects.findIndex(
          p => p.name.toLowerCase() === projectName.toLowerCase()
        );

        if (existingIndex >= 0) {
          projects[existingIndex].count += 1;
        } else {
          projects.push({
            name: projectName,
            chapters: [],
            count: 1,
          });
        }
      }
    }
  }

  return projects.sort((a, b) => a.name.localeCompare(b.name));
}
