import { useState, useRef, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Scissors, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const SplitDialog = ({ open, onOpenChange, statement, onSplit }) => {
  const [splitPoints, setSplitPoints] = useState([]);
  const [inheritCols, setInheritCols] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const textRef = useRef(null);

  const text = statement?.regulation_text || '';

  useEffect(() => {
    if (open) {
      setSplitPoints([]);
      setSelectedText('');
    }
  }, [open]);

  const handleTextSelection = () => {
    if (textRef.current) {
      const selection = window.getSelection();
      const selectedStr = selection.toString();
      if (selectedStr) {
        const range = selection.getRangeAt(0);
        const preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(textRef.current);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        const start = preSelectionRange.toString().length;
        const end = start + selectedStr.length;
        
        setSelectedText(`${start}-${end}`);
      }
    }
  };

  const addSplitFromSelection = () => {
    if (!selectedText) {
      toast.error('Please select text first');
      return;
    }

    const [start, end] = selectedText.split('-').map(Number);
    const newSplit = {
      start,
      end,
      user_section_ref: `${statement.section_ref}-${splitPoints.length + 1}`,
      preview: text.substring(start, end)
    };

    setSplitPoints([...splitPoints, newSplit]);
    setSelectedText('');
  };

  const splitBySentence = () => {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    let currentPos = 0;
    const splits = [];

    sentences.forEach((sent, idx) => {
      const trimmed = sent.trim();
      const start = text.indexOf(trimmed, currentPos);
      const end = start + trimmed.length;
      
      splits.push({
        start,
        end,
        user_section_ref: `${statement.section_ref}-${idx + 1}`,
        preview: trimmed
      });
      
      currentPos = end;
    });

    setSplitPoints(splits);
    toast.success(`Split into ${splits.length} sentences`);
  };

  const splitByDelimiter = (delimiter) => {
    const parts = text.split(delimiter);
    let currentPos = 0;
    const splits = [];

    parts.forEach((part, idx) => {
      if (part.trim()) {
        const trimmed = part.trim();
        const start = text.indexOf(trimmed, currentPos);
        const end = start + trimmed.length;
        
        splits.push({
          start,
          end,
          user_section_ref: `${statement.section_ref}-${idx + 1}`,
          preview: trimmed
        });
        
        currentPos = end;
      }
    });

    setSplitPoints(splits);
    toast.success(`Split into ${splits.length} parts`);
  };

  const removeSplit = (index) => {
    setSplitPoints(splitPoints.filter((_, i) => i !== index));
  };

  const handleSplit = () => {
    if (splitPoints.length < 2) {
      toast.error('You need at least 2 split points');
      return;
    }

    onSplit({
      base_sys_id: statement.sys_id,
      splits: splitPoints.map(({ start, end, user_section_ref }) => ({ start, end, user_section_ref })),
      inherit_user_cols: inheritCols
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5" />
            Split Statement
          </DialogTitle>
          <DialogDescription>
            Select text or use quick split options to break this statement into parts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={splitBySentence}>
              Split by Sentences
            </Button>
            <Button size="sm" variant="outline" onClick={() => splitByDelimiter(';')}>
              Split by Semicolon
            </Button>
            <Button size="sm" variant="outline" onClick={() => splitByDelimiter(':')}>
              Split by Colon
            </Button>
            <Button size="sm" variant="outline" onClick={() => splitByDelimiter('•')}>
              Split by Bullet
            </Button>
          </div>

          {/* Text Selection */}
          <div className="space-y-2">
            <Label>Original Text (Select to mark split point)</Label>
            <div
              ref={textRef}
              className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm leading-relaxed select-text"
              onMouseUp={handleTextSelection}
              data-testid="split-text-area"
            >
              {text}
            </div>
            {selectedText && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600">Selection: {selectedText}</span>
                <Button size="sm" variant="outline" onClick={addSplitFromSelection}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add Split Point
                </Button>
              </div>
            )}
          </div>

          {/* Split Points Preview */}
          {splitPoints.length > 0 && (
            <div className="space-y-2">
              <Label>Split Preview ({splitPoints.length} parts)</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {splitPoints.map((split, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded p-3 flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-slate-700">Part {idx + 1}</span>
                        <Input
                          value={split.user_section_ref}
                          onChange={(e) => {
                            const updated = [...splitPoints];
                            updated[idx].user_section_ref = e.target.value;
                            setSplitPoints(updated);
                          }}
                          className="h-7 text-xs flex-1 max-w-xs"
                          placeholder="Section reference"
                        />
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{split.preview}</p>
                    </div>
                    <button
                      onClick={() => removeSplit(idx)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Options */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={inheritCols}
              onCheckedChange={setInheritCols}
              id="inherit-cols"
            />
            <Label htmlFor="inherit-cols" className="text-sm cursor-pointer">
              Inherit custom column values to all split children
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSplit} disabled={splitPoints.length < 2} data-testid="confirm-split-button">
            Split into {splitPoints.length} Parts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SplitDialog;