import { useState, useEffect } from 'react';
import { Save, Layout } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PRESET_TEMPLATES = [
  {
    name: 'Control Mapping',
    description: 'Map regulations to control frameworks',
    columns: [
      { name: 'L1_Control', column_type: 'text' },
      { name: 'L2_Control', column_type: 'text' },
      { name: 'Archer_Reference', column_type: 'text' }
    ]
  },
  {
    name: 'Design Effectiveness (DE)',
    description: 'Assess control design quality',
    columns: [
      { name: 'Control_Objective', column_type: 'long_text' },
      { name: 'Design_Criteria', column_type: 'text' },
      { name: 'Design_Rating', column_type: 'enum', options: ['Strong', 'Adequate', 'Weak'] },
      { name: 'Design_Review_Notes', column_type: 'long_text' },
      { name: 'Reviewer', column_type: 'text' },
      { name: 'Review_Date', column_type: 'date' }
    ]
  },
  {
    name: 'Operating Effectiveness (OE)',
    description: 'Test control operating effectiveness',
    columns: [
      { name: 'Test_Procedure', column_type: 'long_text' },
      { name: 'Sample_Size', column_type: 'number' },
      { name: 'Evidence_Link', column_type: 'url' },
      { name: 'Result', column_type: 'enum', options: ['Pass', 'Fail', 'Partial'] },
      { name: 'Exceptions_Count', column_type: 'number' },
      { name: 'Tester', column_type: 'text' },
      { name: 'Test_Date', column_type: 'date' }
    ]
  },
  {
    name: 'Workflow & Evidence',
    description: 'Track ownership and completion',
    columns: [
      { name: 'Owner', column_type: 'text' },
      { name: 'Due_Date', column_type: 'date' },
      { name: 'Status', column_type: 'enum', options: ['Not Started', 'In Progress', 'Completed'] },
      { name: 'Evidence_Reference', column_type: 'url' }
    ]
  }
];

const TemplateDialog = ({ documentId, onApply, columns }) => {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API}/templates`);
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleApplyPreset = (preset) => {
    preset.columns.forEach(col => {
      onApply(col);
    });
    setOpen(false);
    toast.success(`Applied ${preset.name} template`);
  };

  const handleSaveCurrentAsTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    try {
      await axios.post(`${API}/templates`, {
        name: newTemplateName,
        description: newTemplateDesc,
        columns: columns
      });
      toast.success('Template saved successfully');
      setNewTemplateName('');
      setNewTemplateDesc('');
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleApplySavedTemplate = async (template) => {
    try {
      await onApply(template.id);
      setOpen(false);
    } catch (error) {
      console.error('Error applying template:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2" data-testid="template-button">
          <Layout className="w-4 h-4" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Column Templates</DialogTitle>
          <DialogDescription>
            Apply preset templates or manage saved templates
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="presets" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
            <TabsTrigger value="save-current">Save Current</TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="space-y-3 mt-4">
            {PRESET_TEMPLATES.map((preset, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded-lg p-4 hover:border-blue-400 cursor-pointer transition"
                onClick={() => handleApplyPreset(preset)}
                data-testid={`preset-template-${idx}`}
              >
                <h4 className="font-semibold text-slate-900">{preset.name}</h4>
                <p className="text-sm text-slate-600 mt-1">{preset.description}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {preset.columns.map((col, colIdx) => (
                    <span key={colIdx} className="text-xs bg-slate-100 px-2 py-1 rounded">
                      {col.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="saved" className="space-y-3 mt-4">
            {templates.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Layout className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No saved templates yet</p>
              </div>
            ) : (
              templates.map((template) => (
                <div
                  key={template.id}
                  className="border border-slate-200 rounded-lg p-4 hover:border-blue-400 cursor-pointer transition"
                  onClick={() => handleApplySavedTemplate(template)}
                  data-testid={`saved-template-${template.id}`}
                >
                  <h4 className="font-semibold text-slate-900">{template.name}</h4>
                  {template.description && (
                    <p className="text-sm text-slate-600 mt-1">{template.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {template.columns.map((col, idx) => (
                      <span key={idx} className="text-xs bg-slate-100 px-2 py-1 rounded">
                        {col.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="save-current" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                placeholder="My Custom Template"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                data-testid="template-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                placeholder="Description of this template"
                value={newTemplateDesc}
                onChange={(e) => setNewTemplateDesc(e.target.value)}
              />
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Current Columns:</p>
              {columns.length === 0 ? (
                <p className="text-sm text-slate-500">No custom columns added yet</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {columns.map((col) => (
                    <span key={col.id} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded">
                      {col.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={handleSaveCurrentAsTemplate}
              className="w-full gap-2"
              disabled={columns.length === 0}
              data-testid="save-template-button"
            >
              <Save className="w-4 h-4" />
              Save as Template
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateDialog;