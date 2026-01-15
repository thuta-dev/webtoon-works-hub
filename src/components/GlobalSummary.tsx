import { useMemo } from 'react';
import { BarChart3, Users, BookOpen, TrendingUp } from 'lucide-react';
import { TeamMember, GlobalProject } from '@/types/webtoon';

interface GlobalSummaryProps {
  members: TeamMember[];
}

export function GlobalSummary({ members }: GlobalSummaryProps) {
  const { globalProjects, totalChapters, totalMembers, totalProjects } = useMemo(() => {
    const projectMap = new Map<string, GlobalProject>();

    for (const member of members) {
      for (const project of member.projects) {
        const key = project.name.toLowerCase();
        const existing = projectMap.get(key);

        if (existing) {
          projectMap.set(key, {
            name: existing.name,
            totalCount: existing.totalCount + project.count,
            contributors: [...new Set([...existing.contributors, member.name])],
          });
        } else {
          projectMap.set(key, {
            name: project.name,
            totalCount: project.count,
            contributors: [member.name],
          });
        }
      }
    }

    const sorted = Array.from(projectMap.values()).sort((a, b) => b.totalCount - a.totalCount);
    const total = sorted.reduce((sum, p) => sum + p.totalCount, 0);

    return {
      globalProjects: sorted,
      totalChapters: total,
      totalMembers: members.filter(m => m.totalChapters > 0).length,
      totalProjects: sorted.length,
    };
  }, [members]);

  return (
    <div className="card-notion p-6 bg-card">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center gap-4 bg-secondary border-2 border-foreground p-4" style={{ boxShadow: 'var(--shadow-hard-sm)' }}>
          <div className="w-12 h-12 border-2 border-foreground bg-background flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Total Chapters</p>
            <p className="text-2xl font-bold text-foreground font-mono">{totalChapters}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-secondary border-2 border-foreground p-4" style={{ boxShadow: 'var(--shadow-hard-sm)' }}>
          <div className="w-12 h-12 border-2 border-foreground bg-background flex items-center justify-center">
            <Users className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Active Members</p>
            <p className="text-2xl font-bold text-foreground font-mono">{totalMembers}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-secondary border-2 border-foreground p-4" style={{ boxShadow: 'var(--shadow-hard-sm)' }}>
          <div className="w-12 h-12 border-2 border-foreground bg-background flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Total Projects</p>
            <p className="text-2xl font-bold text-foreground font-mono">{totalProjects}</p>
          </div>
        </div>
      </div>

      {/* Projects Breakdown */}
      <div className="flex items-center gap-2 mb-4 border-b-2 border-foreground pb-3">
        <BarChart3 className="w-5 h-5 text-foreground" />
        <h3 className="text-lg font-bold text-foreground">Project Breakdown</h3>
      </div>

      {globalProjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {globalProjects.map((project, index) => {
            const maxCount = globalProjects[0]?.totalCount || 1;
            const percentage = (project.totalCount / maxCount) * 100;

            return (
              <div
                key={index}
                className="relative bg-background border-2 border-foreground p-3 overflow-hidden animate-slide-up"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Progress bar background */}
                <div
                  className="absolute inset-0 bg-secondary transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-foreground truncate flex-1 mr-2">
                      {project.name}
                    </span>
                    <span className="text-lg font-bold text-foreground font-mono">
                      {project.totalCount}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {project.contributors.join(', ')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center h-24 text-muted-foreground text-sm border-2 border-dashed border-border">
          No work entries yet. Add members and paste their work to see the summary.
        </div>
      )}
    </div>
  );
}
