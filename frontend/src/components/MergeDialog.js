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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Merge, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';

const MergeDialog = ({ open, onOpenChange, statements, onMerge }) => {
  const [delimiter, setDelimiter] = useState('\n');
  const [userSectionRef, setUserSectionRef] = useState('');
  const [orderedStatements, setOrderedStatements] = useState([]);

  useEffect(() => {
    if (open && statements) {
      setOrderedStatements([...statements].sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));
      setUserSectionRef(statements[0]?.section_ref || '');
    }
  }, [open, statements]);

  const moveUp = (index) => {
    if (index === 0) return;
    const newOrder = [...orderedStatements];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setOrderedStatements(newOrder);
  };

  const moveDown = (index) => {
    if (index === orderedStatements.length - 1) return;
    const newOrder = [...orderedStatements];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setOrderedStatements(newOrder);
  };

  const getPreview = () => {
    const delimiterMap = {
      '\n': '\n',
      ' ': ' ',
      '; ': '; ',
      ', ': ', '
    };
    const actualDelimiter = delimiterMap[delimiter] || delimiter;
    return orderedStatements.map(s => s.regulation_text).join(actualDelimiter);
  };

  const handleMerge = () => {
    if (orderedStatements.length < 2) {
      toast.error('Need at least 2 statements to merge');
      return;
    }

    onMerge({
      sys_ids: orderedStatements.map(s => s.sys_id),
      delimiter: delimiter === '\n' ? '\n' : delimiter,
      user_section_ref: userSectionRef
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="w-5 h-5" />
            Merge Statements
          </DialogTitle>
          <DialogDescription>
            Combine {orderedStatements.length} statements into one. Drag to reorder.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Statement Order */}
          <div className="space-y-2">
            <Label>Statement Order</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto bg-slate-50 p-3 rounded-lg">
              {orderedStatements.map((stmt, idx) => (
                <div
                  key={stmt.sys_id}
                  className="bg-white border border-slate-200 rounded p-2 flex items-center gap-2"
                >
                  <span className="text-xs font-medium text-slate-600 w-8">{idx + 1}.</span>
                  <p className="text-xs text-slate-700 flex-1 line-clamp-2">
                    {stmt.regulation_text}
                  </p>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveUp(idx)}
                      disabled={idx === 0}
                      className="text-slate-600 hover:text-slate-900 disabled:opacity-30"
                    >
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delimiter */}
          <div className="space-y-2">
            <Label>Join With</Label>
            <Select value={delimiter} onValueChange={setDelimiter}>
              <SelectTrigger data-testid="merge-delimiter-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="\n">New Line</SelectItem>
                <SelectItem value=" ">Space</SelectItem>
                <SelectItem value="; ">Semicolon</SelectItem>
                <SelectItem value=", ">Comma</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Section Reference */}
          <div className="space-y-2">
            <Label>Section Reference (optional)</Label>
            <Input
              value={userSectionRef}
              onChange={(e) => setUserSectionRef(e.target.value)}
              placeholder="e.g., 10.1-merged"
              data-testid="merge-section-ref-input"
            />
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 max-h-48 overflow-y-auto">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{getPreview()}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleMerge} data-testid="confirm-merge-button">
            Merge Statements
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MergeDialog;