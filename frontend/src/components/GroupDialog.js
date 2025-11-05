import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderPlus } from 'lucide-react';
import { toast } from 'sonner';

const GroupDialog = ({ open, onOpenChange, statements, onGroup }) => {
  const [groupTitle, setGroupTitle] = useState('');

  useEffect(() => {
    if (open && statements && statements.length > 0) {
      // Suggest a title based on first statement
      const firstTitle = statements[0].section_title || statements[0].section_ref;
      setGroupTitle(`Group: ${firstTitle}`);
    }
  }, [open, statements]);

  const handleGroup = () => {
    if (!groupTitle.trim()) {
      toast.error('Please enter a group title');
      return;
    }

    if (!statements || statements.length < 2) {
      toast.error('Need at least 2 statements to group');
      return;
    }

    onGroup({
      title: groupTitle.trim(),
      sys_ids: statements.map(s => s.sys_id)
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5" />
            Create Group
          </DialogTitle>
          <DialogDescription>
            Group {statements?.length || 0} statements under a common parent
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Group Title</Label>
            <Input
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              placeholder="Enter group name"
              data-testid="group-title-input"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Statements to Group ({statements?.length || 0})</Label>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 max-h-48 overflow-y-auto">
              {statements?.map((stmt, idx) => (
                <div key={stmt.sys_id} className="text-xs text-slate-600 py-1">
                  {idx + 1}. {stmt.section_ref} - {stmt.section_title || 'No title'}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGroup} data-testid="confirm-group-button">
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GroupDialog;