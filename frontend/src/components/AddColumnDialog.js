import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

const AddColumnDialog = ({ onAdd }) => {
  const [open, setOpen] = useState(false);
  const [columnData, setColumnData] = useState({
    name: '',
    column_type: 'text',
    options: [],
    default_value: '',
  });
  const [optionsText, setOptionsText] = useState('');

  const handleSubmit = () => {
    if (!columnData.name.trim()) return;

    const data = {
      ...columnData,
      options: columnData.column_type === 'enum' || columnData.column_type === 'multi_select'
        ? optionsText.split(',').map(o => o.trim()).filter(Boolean)
        : null
    };

    onAdd(data);
    setOpen(false);
    setColumnData({ name: '', column_type: 'text', options: [], default_value: '' });
    setOptionsText('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2" data-testid="add-column-button">
          <Plus className="w-4 h-4" />
          Add Column
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Custom Column</DialogTitle>
          <DialogDescription>
            Create a new column to track additional data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Column Name</Label>
            <Input
              placeholder="e.g., Control ID, Owner, Status"
              value={columnData.name}
              onChange={(e) => setColumnData({ ...columnData, name: e.target.value })}
              data-testid="column-name-input"
            />
          </div>

          <div className="space-y-2">
            <Label>Column Type</Label>
            <Select
              value={columnData.column_type}
              onValueChange={(value) => setColumnData({ ...columnData, column_type: value })}
            >
              <SelectTrigger data-testid="column-type-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="long_text">Long Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="enum">Dropdown (Single)</SelectItem>
                <SelectItem value="multi_select">Multi-select</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="url">URL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(columnData.column_type === 'enum' || columnData.column_type === 'multi_select') && (
            <div className="space-y-2">
              <Label>Options (comma-separated)</Label>
              <Input
                placeholder="Option 1, Option 2, Option 3"
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                data-testid="column-options-input"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Default Value (optional)</Label>
            <Input
              placeholder="Default value"
              value={columnData.default_value}
              onChange={(e) => setColumnData({ ...columnData, default_value: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} data-testid="save-column-button">Add Column</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddColumnDialog;