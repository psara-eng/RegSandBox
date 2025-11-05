import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, Download, Plus, Settings, Eye, EyeOff, 
  Filter, Search, X, Trash2, Save 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import StatementTable from '../components/StatementTable';
import AddColumnDialog from '../components/AddColumnDialog';
import TemplateDialog from '../components/TemplateDialog';
import PreviewPane from '../components/PreviewPane';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WorkspacePage = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [statements, setStatements] = useState([]);
  const [columns, setColumns] = useState([]);
  const [filteredStatements, setFilteredStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatement, setSelectedStatement] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showPreview, setShowPreview] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState([]);

  useEffect(() => {
    fetchData();
  }, [documentId]);

  useEffect(() => {
    applyFilters();
  }, [statements, searchTerm, filterType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docRes, stmtsRes, colsRes] = await Promise.all([
        axios.get(`${API}/documents`),
        axios.get(`${API}/documents/${documentId}/statements`),
        axios.get(`${API}/columns/${documentId}`)
      ]);

      const doc = docRes.data.find(d => d.id === documentId);
      setDocument(doc);
      setStatements(stmtsRes.data);
      setColumns(colsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load workspace data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...statements];

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(stmt => 
        stmt.regulation_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stmt.section_ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stmt.hierarchy_path?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(stmt => stmt.statement_type === filterType);
    }

    setFilteredStatements(filtered);
  };

  const handleUpdateStatement = async (statementId, customFields) => {
    try {
      await axios.put(`${API}/statements/${statementId}`, { custom_fields: customFields });
      
      // Update local state
      setStatements(prev => 
        prev.map(stmt => 
          stmt.id === statementId 
            ? { ...stmt, custom_fields: customFields }
            : stmt
        )
      );
      
      toast.success('Statement updated');
    } catch (error) {
      console.error('Error updating statement:', error);
      toast.error('Failed to update statement');
    }
  };

  const handleAddColumn = async (columnData) => {
    try {
      const newColumn = {
        ...columnData,
        document_id: documentId
      };
      
      await axios.post(`${API}/columns`, newColumn);
      await fetchData();
      toast.success('Column added successfully');
    } catch (error) {
      console.error('Error adding column:', error);
      toast.error('Failed to add column');
    }
  };

  const handleDeleteColumn = async (columnId) => {
    try {
      await axios.delete(`${API}/columns/${columnId}`);
      await fetchData();
      toast.success('Column deleted');
    } catch (error) {
      console.error('Error deleting column:', error);
      toast.error('Failed to delete column');
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await axios.get(`${API}/export/${documentId}?format=${format}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `export_${documentId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Exported to ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const handleApplyTemplate = async (templateId) => {
    try {
      await axios.post(`${API}/templates/${templateId}/apply?document_id=${documentId}`);
      await fetchData();
      toast.success('Template applied successfully');
    } catch (error) {
      console.error('Error applying template:', error);
      toast.error('Failed to apply template');
    }
  };

  const toggleColumnVisibility = (columnName) => {
    setHiddenColumns(prev => 
      prev.includes(columnName)
        ? prev.filter(c => c !== columnName)
        : [...prev, columnName]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="gap-2"
                data-testid="back-to-home-button"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="border-l border-slate-200 h-6"></div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">{document?.filename}</h1>
                <p className="text-sm text-slate-500">{filteredStatements.length} statements</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="gap-2"
                data-testid="toggle-preview-button"
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                Preview
              </Button>

              <AddColumnDialog onAdd={handleAddColumn} />

              <TemplateDialog 
                documentId={documentId}
                onApply={handleApplyTemplate}
                columns={columns}
              />

              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2" data-testid="export-button">
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Export Data</DialogTitle>
                    <DialogDescription>
                      Choose format to export your statements
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex gap-3 py-4">
                    <Button
                      onClick={() => handleExport('csv')}
                      variant="outline"
                      className="flex-1"
                      data-testid="export-csv-button"
                    >
                      Export as CSV
                    </Button>
                    <Button
                      onClick={() => handleExport('xlsx')}
                      variant="outline"
                      className="flex-1"
                      data-testid="export-xlsx-button"
                    >
                      Export as XLSX
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search statements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  data-testid="clear-search-button"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48" data-testid="filter-select">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Obligation">Obligation</SelectItem>
                <SelectItem value="Prohibition">Prohibition</SelectItem>
                <SelectItem value="Recommendation">Recommendation</SelectItem>
                <SelectItem value="Definition">Definition</SelectItem>
                <SelectItem value="Exception">Exception</SelectItem>
              </SelectContent>
            </Select>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" data-testid="column-settings-button">
                  <Settings className="w-4 h-4" />
                  Columns
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Column Visibility</DialogTitle>
                  <DialogDescription>
                    Show or hide columns in the table
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-4">
                  {['hierarchy_path', 'section_ref', 'section_title', 'page_number', 'statement_type'].map(col => (
                    <div key={col} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                      <span className="text-sm">{col.replace('_', ' ')}</span>
                      <input
                        type="checkbox"
                        checked={!hiddenColumns.includes(col)}
                        onChange={() => toggleColumnVisibility(col)}
                        className="w-4 h-4"
                      />
                    </div>
                  ))}
                  {columns.map(col => (
                    <div key={col.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                      <span className="text-sm">{col.name}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!hiddenColumns.includes(col.name)}
                          onChange={() => toggleColumnVisibility(col.name)}
                          className="w-4 h-4"
                        />
                        <button
                          onClick={() => handleDeleteColumn(col.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-180px)]">
        {/* Table Area */}
        <div className={`flex-1 overflow-auto p-6 ${showPreview ? 'w-2/3' : 'w-full'}`}>
          <StatementTable
            statements={filteredStatements}
            columns={columns}
            hiddenColumns={hiddenColumns}
            onUpdate={handleUpdateStatement}
            onSelectStatement={setSelectedStatement}
            selectedStatement={selectedStatement}
          />
        </div>

        {/* Preview Pane */}
        {showPreview && (
          <div className="w-1/3 border-l border-slate-200 bg-white">
            <PreviewPane
              documentId={documentId}
              selectedStatement={selectedStatement}
              document={document}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspacePage;