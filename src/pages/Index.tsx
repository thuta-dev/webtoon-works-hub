import { useState, useCallback } from 'react';
import { Plus, Users } from 'lucide-react';
import { Header } from '@/components/Header';
import { MemberCard } from '@/components/MemberCard';
import { GlobalSummary } from '@/components/GlobalSummary';
import { TeamMember } from '@/types/webtoon';

const generateId = () => Math.random().toString(36).substring(2, 9);

const Index = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);

  const addMember = useCallback(() => {
    const newMember: TeamMember = {
      id: generateId(),
      name: `Member ${members.length + 1}`,
      rawInput: '',
      projects: [],
      totalChapters: 0,
    };
    setMembers(prev => [...prev, newMember]);
  }, [members.length]);

  const updateMember = useCallback((updatedMember: TeamMember) => {
    setMembers(prev =>
      prev.map(m => (m.id === updatedMember.id ? updatedMember : m))
    );
  }, []);

  const deleteMember = useCallback((id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Add Member Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-foreground" />
            <h2 className="text-2xl font-bold text-foreground">Team Members</h2>
            {members.length > 0 && (
              <span className="px-2.5 py-0.5 border-2 border-foreground text-foreground text-sm font-bold">
                {members.length}
              </span>
            )}
          </div>
          <button
            onClick={addMember}
            className="btn-notion flex items-center gap-2 px-5 py-2.5 bg-foreground text-background font-bold"
          >
            <Plus className="w-5 h-5" />
            Add New Member
          </button>
        </div>

        {/* Members Grid */}
        {members.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {members.map(member => (
              <MemberCard
                key={member.id}
                member={member}
                onUpdate={updateMember}
                onDelete={deleteMember}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 mb-12 border-2 border-dashed border-border">
            <div className="w-20 h-20 border-2 border-foreground bg-secondary flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No team members yet</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Click the "Add New Member" button above to start tracking your team's work.
            </p>
            <button
              onClick={addMember}
              className="btn-notion flex items-center gap-2 px-6 py-3 bg-foreground text-background font-bold"
            >
              <Plus className="w-5 h-5" />
              Add Your First Member
            </button>
          </div>
        )}

        {/* Global Summary */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-foreground bg-secondary flex items-center justify-center">
              <span className="text-foreground text-lg font-bold">Σ</span>
            </div>
            Global Summary
          </h2>
          <GlobalSummary members={members} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-foreground bg-background py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground font-medium">
          Webtoon Typesetting Team Dashboard • Real-time work tracking
        </div>
      </footer>
    </div>
  );
};

export default Index;
