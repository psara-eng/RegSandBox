import { useState, useEffect } from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PreviewPane = ({ documentId, selectedStatement, document }) => {
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (documentId) {
      fetchPreview();
    }
  }, [documentId]);

  const fetchPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API}/documents/${documentId}/preview`);
      setPreviewData(response.data);
    } catch (err) {
      console.error('Preview error:', err);
      setError('Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-slate-600" />
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">{document?.filename}</h3>
            <p className="text-xs text-slate-500">Document Preview</p>
          </div>
        </div>
      </div>

      {/* Selected Statement Info */}
      {selectedStatement && (
        <div className="border-b border-slate-200 p-4 bg-blue-50">
          <p className="text-xs font-medium text-blue-900 mb-1">Selected Statement</p>
          <p className="text-sm text-slate-700 font-medium">{selectedStatement.section_ref}</p>
          {selectedStatement.page_number && (
            <p className="text-xs text-slate-500 mt-1">Page {selectedStatement.page_number}</p>
          )}
          <div className="mt-3 p-3 bg-white rounded border border-blue-200">
            <p className="text-xs text-slate-600">{selectedStatement.regulation_text}</p>
          </div>
        </div>
      )}

      {/* Preview Area */}
      <div className="flex-1 overflow-auto p-4">
        {previewData?.file_type === '.pdf' ? (
          <div className="text-center py-8">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-600">PDF Preview</p>
            <p className="text-xs text-slate-400 mt-1">Full PDF viewer coming soon</p>
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-600">Document loaded</p>
            <p className="text-xs text-slate-400 mt-1">Select a statement to highlight</p>
          </div>
        )}
      </div>

      {/* Citation Helper */}
      {selectedStatement && (
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <p className="text-xs font-medium text-slate-700 mb-2">Citation</p>
          <div className="bg-white border border-slate-200 rounded p-2">
            <p className="text-xs text-slate-600 font-mono">
              {document?.filename}, Section {selectedStatement.section_ref}
              {selectedStatement.page_number && `, Page ${selectedStatement.page_number}`}
            </p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `${document?.filename}, Section ${selectedStatement.section_ref}${selectedStatement.page_number ? `, Page ${selectedStatement.page_number}` : ''}`
              );
            }}
            className="text-xs text-blue-600 hover:text-blue-700 mt-2"
          >
            Copy Citation
          </button>
        </div>
      )}
    </div>
  );
};

export default PreviewPane;