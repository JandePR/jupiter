import React from 'react';
    import { Label } from '@/components/ui/label';
    import { Textarea } from '@/components/ui/textarea';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Users } from 'lucide-react';
import PropTypes from 'prop-types';

    const StaffAssignmentFormSection = ({ staffMembers, assignedStaffId, setAssignedStaffId, notes, setNotes }) => {
      return (
        <section className="space-y-4 p-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 shadow-inner">
          <h2 className="text-xl font-semibold flex items-center text-slate-700 dark:text-slate-200">
            <Users className="mr-2 h-6 w-6 text-purple-500 dark:text-purple-400" />
            Staff Assignment & Notes
          </h2>
          <div>
            <Label htmlFor="assignedStaff" className="text-slate-700 dark:text-slate-300 font-medium">Assign Staff (Drafter/PM)</Label>
            <Select onValueChange={setAssignedStaffId} value={assignedStaffId}>
              <SelectTrigger id="assignedStaff" className="w-full mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-purple-500 dark:focus:ring-purple-500">
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-800">
                <SelectItem value="none">None</SelectItem>
                {(staffMembers || []).map(staff => (
                  <SelectItem key={staff.id} value={staff.id}>{staff.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="notes" className="text-slate-700 dark:text-slate-300 font-medium">Additional Notes</Label>
            <Textarea 
              id="notes" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="Any specific instructions or details..." 
              className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-500" 
            />
          </div>
        </section>
      );
    };

    StaffAssignmentFormSection.propTypes = {
      staffMembers: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          full_name: PropTypes.string.isRequired
        })
      ).isRequired,
      assignedStaffId: PropTypes.string,
      setAssignedStaffId: PropTypes.func.isRequired,
      notes: PropTypes.string,
      setNotes: PropTypes.func.isRequired
    };

StaffAssignmentFormSection.defaultProps = {
  assignedStaffId: '',
  notes: '',
  staffMembers: []
};

    export default React.memo(StaffAssignmentFormSection);