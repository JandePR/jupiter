import React from 'react';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
    import { Button } from '@/components/ui/button';
    import { Eye, Edit3, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
    import { motion, AnimatePresence } from 'framer-motion';
    import ProjectDetailsCard from './ProjectDetailsCard';

    const ProjectTable = ({ 
      projects, 
      sortConfig, 
      handleSort, 
      expandedProjectId, 
      toggleExpandProject, 
      handleDeleteProject,
      userRole,
      userId
    }) => {
      
      const getStatusBadgeClass = (status) => {
        switch (status) {
          case 'Completed': return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300';
          case 'In Progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300';
          case 'Pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300';
          case 'Review': return 'bg-purple-100 text-purple-700 dark:bg-purple-700/30 dark:text-purple-300';
          default: return 'bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-200';
        }
      };

      const tableHeaders = [
        { key: 'project_name', label: 'Project Name' },
        { key: 'client_profile', label: 'Client' },
        { key: 'status', label: 'Status' },
        { key: 'type', label: 'Type' },
        { key: 'created_at', label: 'Created' },
      ];

      return (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <TableHead className="w-[50px]"></TableHead>
                {tableHeaders.map((header) => (
                  <TableHead 
                    key={header.key} 
                    onClick={() => handleSort(header.key)} 
                    className="cursor-pointer hover:text-purple-500 dark:hover:text-purple-400"
                  >
                    <div className="flex items-center">
                      {header.label}
                      {sortConfig.key === header.key && (
                        sortConfig.direction === 'ascending' ? 
                        <ChevronUp className="ml-1 h-4 w-4" /> : 
                        <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                ))}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <React.Fragment key={project.id}>
                  <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-700/50 data-[state=selected]:bg-slate-100 dark:data-[state=selected]:bg-slate-700">
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => toggleExpandProject(project.id)} 
                        className="text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400"
                      >
                        {expandedProjectId === project.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium text-slate-800 dark:text-slate-100">{project.project_name}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300">{project.client_profile?.full_name || project.client_email || 'N/A'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(project.status)}`}>
                        {project.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300">{project.type || 'N/A'}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300">{new Date(project.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button variant="outline" size="icon" className="border-slate-300 hover:border-purple-500 hover:text-purple-500 dark:border-slate-600 dark:hover:border-purple-400 dark:hover:text-purple-400">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(userRole === 'staff_admin' || (userRole === 'staff_drafter' && project.assigned_staff_id === userId)) && (
                          <Button variant="outline" size="icon" className="border-slate-300 hover:border-yellow-500 hover:text-yellow-500 dark:border-slate-600 dark:hover:border-yellow-400 dark:hover:text-yellow-400">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                        {userRole === 'staff_admin' && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleDeleteProject(project.id)} 
                            className="border-slate-300 hover:border-red-500 hover:text-red-500 dark:border-slate-600 dark:hover:border-red-400 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  <AnimatePresence>
                    {expandedProjectId === project.id && (
                      <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                        <TableCell colSpan={7}>
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="p-0"
                          >
                            <ProjectDetailsCard project={project} />
                          </motion.div>
                        </TableCell>
                      </TableRow>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    };

    export default ProjectTable;