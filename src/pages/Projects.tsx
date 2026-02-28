import { useState } from "react";
import { useProjects } from "@/hooks/useProjects";
import { ProjectList } from "@/components/projects/ProjectList";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { ProjectDetail } from "@/components/projects/ProjectDetail";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban } from "lucide-react";

type View = { type: 'list' } | { type: 'create' } | { type: 'detail'; id: string };

const Projects = () => {
  const [view, setView] = useState<View>({ type: 'list' });
  const { projects, isLoading, createProject, updateProject, deleteProject } = useProjects();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FolderKanban className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading">Project Workspace</h1>
            <p className="text-sm text-muted-foreground font-body">Kelola proyek dan hubungkan dengan toolkit kompetensi</p>
          </div>
        </div>
        {view.type === 'list' && (
          <Button onClick={() => setView({ type: 'create' })} className="bg-gradient-amber text-accent-foreground font-heading shadow-amber hover:brightness-110">
            <Plus className="w-4 h-4 mr-1" /> Tambah Proyek
          </Button>
        )}
        {view.type !== 'list' && (
          <Button variant="outline" onClick={() => setView({ type: 'list' })}>
            ← Kembali
          </Button>
        )}
      </div>

      {/* Content */}
      {view.type === 'list' && (
        <ProjectList
          projects={projects}
          isLoading={isLoading}
          onSelect={(id) => setView({ type: 'detail', id })}
          onDelete={(id) => deleteProject.mutate(id)}
        />
      )}

      {view.type === 'create' && (
        <ProjectForm
          onSubmit={(data) => {
            createProject.mutate(data, { onSuccess: () => setView({ type: 'list' }) });
          }}
          isSubmitting={createProject.isPending}
        />
      )}

      {view.type === 'detail' && (
        <ProjectDetail
          projectId={view.id}
          onBack={() => setView({ type: 'list' })}
          onUpdate={(data) => updateProject.mutate(data)}
        />
      )}
    </div>
  );
};

export default Projects;
