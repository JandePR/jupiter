import React, { useState } from 'react';
    import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { motion, AnimatePresence } from 'framer-motion';
    import { CheckCircle, AlertCircle, Clock, FileText, Users, ChevronRight, ChevronDown, MessageCircle, Download } from 'lucide-react';

    const ProjectPhaseCard = ({ phase, phaseIndex, currentPhaseIndex }) => {
      const [isOpen, setIsOpen] = useState(phaseIndex === currentPhaseIndex);

      const getStatusIconAndColor = () => {
        if (phase.status === 'Completed') return { icon: <CheckCircle className="h-5 w-5 text-green-500" />, color: 'text-green-500 dark:text-green-400', bgColor: 'bg-green-500/10 dark:bg-green-500/20', borderColor: 'border-green-500' };
        if (phase.status === 'In Progress') return { icon: <Clock className="h-5 w-5 text-yellow-500" />, color: 'text-yellow-500 dark:text-yellow-400', bgColor: 'bg-yellow-500/10 dark:bg-yellow-500/20', borderColor: 'border-yellow-500' };
        return { icon: <AlertCircle className="h-5 w-5 text-slate-400" />, color: 'text-slate-400 dark:text-slate-500', bgColor: 'bg-slate-500/10 dark:bg-slate-500/20', borderColor: 'border-slate-400' };
      };

      const { icon, color, bgColor, borderColor } = getStatusIconAndColor();
      const isActivePhase = phaseIndex === currentPhaseIndex;

      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className={`overflow-hidden transition-all duration-300 ${isActivePhase ? 'shadow-lg border-purple-500 dark:border-purple-400' : 'shadow-md border-transparent'} ${bgColor}`}>
            <CardHeader 
              className={`flex flex-row items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${isActivePhase ? 'bg-purple-50 dark:bg-purple-900/30' : ''}`}
              onClick={() => setIsOpen(!isOpen)}
            >
              <div className="flex items-center space-x-3">
                <span className={`flex items-center justify-center h-8 w-8 rounded-full ${isActivePhase ? 'bg-purple-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'} font-semibold text-sm`}>
                  {phaseIndex + 1}
                </span>
                <CardTitle className={`text-lg font-semibold ${isActivePhase ? 'text-purple-700 dark:text-purple-300' : 'text-slate-700 dark:text-slate-200'}`}>{phase.name}</CardTitle>
              </div>
              <div className="flex items-center space-x-3">
                <div className={`flex items-center space-x-1 text-sm font-medium px-2 py-1 rounded-full ${bgColor} ${color}`}>
                  {icon}
                  <span>{phase.status}</span>
                </div>
                <Button variant="ghost" size="icon" className="text-slate-500 dark:text-slate-400 hover:text-purple-500 dark:hover:text-purple-400">
                  {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </Button>
              </div>
            </CardHeader>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <CardContent className="p-6 space-y-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    {phase.notes && (
                      <div className="flex items-start space-x-3">
                        <MessageCircle className="h-5 w-5 text-purple-500 dark:text-purple-400 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes:</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{phase.notes}</p>
                        </div>
                      </div>
                    )}
                    {phase.assigned_staff && (
                      <div className="flex items-center space-x-3">
                        <Users className="h-5 w-5 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                        <p className="text-sm">
                          <span className="font-medium text-slate-700 dark:text-slate-300">Assigned:</span>{' '}
                          <span className="text-slate-600 dark:text-slate-400">{phase.assigned_staff}</span>
                        </p>
                      </div>
                    )}
                    {phase.documents && phase.documents.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                           <FileText className="h-5 w-5 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                           <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Documents:</p>
                        </div>
                        <ul className="space-y-1 pl-8">
                          {phase.documents.map((doc, idx) => (
                            <li key={idx} className="text-sm">
                              <a 
                                href={doc.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-800 dark:hover:text-blue-300"
                              >
                                <Download className="h-4 w-4 mr-2 flex-shrink-0" />
                                {doc.name}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(!phase.notes && !phase.assigned_staff && (!phase.documents || phase.documents.length === 0)) && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">No additional details for this phase yet.</p>
                    )}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      );
    };

    export default ProjectPhaseCard;