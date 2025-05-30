import React from 'react';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Textarea } from '@/components/ui/textarea';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Building, CalendarDays } from 'lucide-react';

    const projectTypes = [
      { value: "Residential Solar", label: "Residential Solar PV" },
      { value: "Commercial Solar", label: "Commercial Solar PV" },
      { value: "Battery Storage", label: "Battery Storage System" },
      { value: "EV Charger", label: "EV Charger Installation" },
      { value: "Other", label: "Other Custom Project" },
    ];

    const ProjectInformationFormSection = ({ 
      projectName, setProjectName, 
      projectType, setProjectType, 
      projectAddress, setProjectAddress,
      startDate, setStartDate,
      deadline, setDeadline
    }) => {
      return (
        <section className="space-y-4 p-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 shadow-inner">
          <h2 className="text-xl font-semibold flex items-center text-slate-700 dark:text-slate-200">
            <Building className="mr-2 h-6 w-6 text-purple-500 dark:text-purple-400" />
            Project Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="projectName" className="text-slate-700 dark:text-slate-300 font-medium">Project Name</Label>
              <Input 
                id="projectName" 
                value={projectName} 
                onChange={(e) => setProjectName(e.target.value)} 
                placeholder="e.g., Smith Residence Solar" 
                required 
                className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-500" 
              />
            </div>
            <div>
              <Label htmlFor="projectType" className="text-slate-700 dark:text-slate-300 font-medium">Project Type</Label>
              <Select onValueChange={setProjectType} value={projectType} required>
                <SelectTrigger id="projectType" className="w-full mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-purple-500 dark:focus:ring-purple-500">
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800">
                  {projectTypes.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="projectAddress" className="text-slate-700 dark:text-slate-300 font-medium">Project Address</Label>
            <Textarea 
              id="projectAddress" 
              value={projectAddress} 
              onChange={(e) => setProjectAddress(e.target.value)} 
              placeholder="123 Main St, Anytown, USA" 
              required 
              className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-500" 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="startDate" className="text-slate-700 dark:text-slate-300 font-medium flex items-center">
                <CalendarDays className="mr-2 h-4 w-4 text-slate-500 dark:text-slate-400" /> Start Date
              </Label>
              <Input 
                id="startDate" 
                type="date"
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-500" 
              />
            </div>
            <div>
              <Label htmlFor="deadline" className="text-slate-700 dark:text-slate-300 font-medium flex items-center">
                <CalendarDays className="mr-2 h-4 w-4 text-slate-500 dark:text-slate-400" /> Deadline
              </Label>
              <Input 
                id="deadline" 
                type="date"
                value={deadline} 
                onChange={(e) => setDeadline(e.target.value)} 
                className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-500" 
              />
            </div>
          </div>
        </section>
      );
    };

    export default ProjectInformationFormSection;