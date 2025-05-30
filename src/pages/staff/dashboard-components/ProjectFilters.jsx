import React from 'react';
    import { Input } from '@/components/ui/input';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Search, Filter } from 'lucide-react';

    const ProjectFilters = ({ searchTerm, setSearchTerm, filterStatus, setFilterStatus }) => {
      const statusOptions = [
        { value: "all", label: "All Statuses" },
        { value: "Pending", label: "Pending" },
        { value: "In Progress", label: "In Progress" },
        { value: "Review", label: "Review" },
        { value: "Completed", label: "Completed" },
        { value: "On Hold", label: "On Hold" },
      ];

      return (
        <div className="mt-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
            <Input 
              placeholder="Search by name, client, email, address..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-50 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-500"
              aria-label="Search projects"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger 
                className="w-full md:w-[180px] bg-slate-50 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 focus:ring-purple-500 dark:focus:ring-purple-500"
                aria-label="Filter by status"
              >
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-800">
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    };

    export default ProjectFilters;