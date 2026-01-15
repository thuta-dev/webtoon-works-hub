export interface ParsedProject {
  name: string;
  chapters: number[];
  count: number;
}

export interface TeamMember {
  id: string;
  name: string;
  rawInput: string;
  projects: ParsedProject[];
  totalChapters: number;
}

export interface GlobalProject {
  name: string;
  totalCount: number;
  contributors: string[];
}
