import React from 'react';
    import { Briefcase, User, Calendar, Zap, Info } from 'lucide-react';

    const DetailItem = ({ icon: Icon, label, value }) => (
      <div className="flex items-start space-x-2 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-150">
        <Icon className="h-5 w-5 text-purple-500 dark:text-purple-400 mt-0.5 flex-shrink-0" />
        <div>
          <span className="text-slate-500 dark:text-slate-400 font-medium">{label}:</span>
          <p className="text-slate-700 dark:text-slate-200 break-words">{value || 'N/A'}</p>
        </div>
      </div>
    );

    const ProjectDetailsCard = ({ project }) => {
      if (!project) return null;

      const currentPhase = project.phases?.[project.current_phase_index];

      return (
        <div className="p-4 space-y-4 bg-slate-100/50 dark:bg-slate-700/20 rounded-b-lg">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 border-b pb-2 border-slate-300 dark:border-slate-600">
            Details for: <span className="text-purple-600 dark:text-purple-400">{project.project_name}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 text-sm">
            <DetailItem icon={Briefcase} label="Type" value={project.type} />
            <DetailItem icon={User} label="Client" value={project.client_profile?.full_name || project.client_email} />
            <DetailItem icon={User} label="Assigned Staff" value={project.assigned_staff_profile?.full_name} />
            <DetailItem icon={Zap} label="Address" value={project.address} />
            <DetailItem icon={Calendar} label="Created" value={new Date(project.created_at).toLocaleString()} />
            <DetailItem icon={Calendar} label="Last Updated" value={new Date(project.updated_at).toLocaleString()} />
          </div>
          {currentPhase && (
            <div className="mt-3 pt-3 border-t border-slate-300 dark:border-slate-600">
              <DetailItem 
                icon={Info} 
                label="Current Phase" 
                value={`${currentPhase.name} (${currentPhase.status})`} 
              />
            </div>
          )}
           {project.notes && (
            <div className="mt-3 pt-3 border-t border-slate-300 dark:border-slate-600">
                <DetailItem icon={Info} label="Notes" value={project.notes} />
            </div>
           )}
        </div>
      );
    };

    export default ProjectDetailsCard;