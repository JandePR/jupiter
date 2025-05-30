import React from 'react';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { UserPlus } from 'lucide-react';

    const ClientInformationFormSection = ({ 
      clientSelectionMode, 
      setClientSelectionMode, 
      clientName, 
      setClientName, 
      clientEmail, 
      setClientEmail, 
      existingClients, 
      existingClientId, 
      setExistingClientId 
    }) => {
      return (
        <section className="space-y-4 p-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 shadow-inner">
          <h2 className="text-xl font-semibold flex items-center text-slate-700 dark:text-slate-200">
            <UserPlus className="mr-2 h-6 w-6 text-purple-500 dark:text-purple-400" />
            Client Information
          </h2>
          <Select onValueChange={setClientSelectionMode} defaultValue="new">
            <SelectTrigger className="w-full md:w-1/2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-purple-500 dark:focus:ring-purple-500">
              <SelectValue placeholder="Select client type" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-800">
              <SelectItem value="new">New Client</SelectItem>
              <SelectItem value="existing">Existing Client</SelectItem>
            </SelectContent>
          </Select>

          {clientSelectionMode === 'new' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <Label htmlFor="clientName" className="text-slate-700 dark:text-slate-300 font-medium">Client Full Name</Label>
                <Input 
                  id="clientName" 
                  value={clientName} 
                  onChange={(e) => setClientName(e.target.value)} 
                  placeholder="John Doe" 
                  required={clientSelectionMode === 'new'} 
                  className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-500" 
                />
              </div>
              <div>
                <Label htmlFor="clientEmail" className="text-slate-700 dark:text-slate-300 font-medium">Client Email</Label>
                <Input 
                  id="clientEmail" 
                  type="email" 
                  value={clientEmail} 
                  onChange={(e) => setClientEmail(e.target.value)} 
                  placeholder="client@example.com" 
                  required={clientSelectionMode === 'new'} 
                  className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-500" 
                />
              </div>
            </div>
          )}

          {clientSelectionMode === 'existing' && (
            <div className="mt-4">
              <Label htmlFor="existingClient" className="text-slate-700 dark:text-slate-300 font-medium">Select Existing Client</Label>
              <Select onValueChange={setExistingClientId} value={existingClientId} required={clientSelectionMode === 'existing'}>
                <SelectTrigger id="existingClient" className="w-full mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-purple-500 dark:focus:ring-purple-500">
                  <SelectValue placeholder="Select an existing client" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800">
                  {existingClients.length > 0 ? existingClients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.full_name} ({client.email})</SelectItem>
                  )) : <SelectItem value="no_clients" disabled>No existing clients found</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          )}
        </section>
      );
    };

    export default ClientInformationFormSection;