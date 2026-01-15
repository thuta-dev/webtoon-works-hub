import { useState, useEffect } from 'react';
import { Trash2, User, FileText, Hash } from 'lucide-react';
import { TeamMember } from '@/types/webtoon';
import { parseProjectInput } from '@/utils/parseProjects';

interface MemberCardProps {
  member: TeamMember;
  onUpdate: (member: TeamMember) => void;
  onDelete: (id: string) => void;
}

export function MemberCard({ member, onUpdate, onDelete }: MemberCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(member.name);

  useEffect(() => {
    const projects = parseProjectInput(member.rawInput);
    const totalChapters = projects.reduce((sum, p) => sum + p.count, 0);
    
    if (JSON.stringify(projects) !== JSON.stringify(member.projects) || totalChapters !== member.totalChapters) {
      onUpdate({
        ...member,
        projects,
        totalChapters,
      });
    }
  }, [member.rawInput]);

  const handleNameSubmit = () => {
    setIsEditing(false);
    if (name.trim() !== member.name) {
      onUpdate({ ...member, name: name.trim() || 'Unnamed' });
    }
  };

  const handleInputChange = (value: string) => {
    onUpdate({ ...member, rawInput: value });
  };

  return (
    <div className="card-notion p-5 animate-fade-in flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-2 border-foreground bg-secondary flex items-center justify-center">
            <User className="w-5 h-5 text-foreground" />
          </div>
          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              className="input-notion px-3 py-1.5 text-foreground font-semibold focus:outline-none"
              autoFocus
            />
          ) : (
            <h3
              onClick={() => setIsEditing(true)}
              className="text-lg font-semibold text-foreground cursor-pointer hover:underline underline-offset-2 transition-all"
            >
              {member.name}
            </h3>
          )}
        </div>
        <button
          onClick={() => onDelete(member.id)}
          className="p-2 border-2 border-foreground text-foreground hover:bg-foreground hover:text-background transition-all duration-100"
          title="Remove member"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Input Area */}
      <div className="mb-4 flex-shrink-0">
        <label className="flex items-center gap-2 text-sm text-muted-foreground mb-2 font-medium">
          <FileText className="w-4 h-4" />
          Paste work entries
        </label>
        <textarea
          value={member.rawInput}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="ME - 506 / 522 / 517&#10;Space monster - 70 /&#10;Superhuman - 23 / 24 / 25"
          className="w-full h-32 input-notion px-4 py-3 text-foreground placeholder:text-muted-foreground font-mono text-sm resize-none scrollbar-notion"
        />
      </div>

      {/* Parsed Projects List */}
      <div className="flex-1 overflow-hidden">
        {member.projects.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-notion pr-1">
            {member.projects.map((project, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-secondary border-2 border-foreground px-3 py-2 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="text-sm text-foreground truncate flex-1 mr-2 font-medium">
                  {project.name}
                </span>
                <span className="flex items-center gap-1 text-foreground font-mono text-sm font-bold">
                  <Hash className="w-3 h-3" />
                  {project.count}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-24 text-muted-foreground text-sm border-2 border-dashed border-border">
            No projects parsed yet
          </div>
        )}
      </div>

      {/* Member Total */}
      <div className="mt-4 pt-4 border-t-2 border-foreground">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-medium">Total Chapters</span>
          <span className="text-xl font-bold text-foreground font-mono">
            {member.totalChapters}
          </span>
        </div>
      </div>
    </div>
  );
}
