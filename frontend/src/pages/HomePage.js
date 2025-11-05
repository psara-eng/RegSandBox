import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Upload, FileText, Loader2, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API}/documents`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setUploadProgress({ filename: file.name, status: 'uploading' });

    try {
      const response = await axios.post(`${API}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadProgress({ filename: file.name, status: 'success' });
      toast.success('Document uploaded and parsed successfully!');
      
      // Refresh document list
      await fetchDocuments();
      
      // Navigate to workspace after a short delay
      setTimeout(() => {
        navigate(`/workspace/${response.data.document_id}`);
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress({ filename: file.name, status: 'error' });
      toast.error(error.response?.data?.detail || 'Failed to upload document');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(null);
      }, 2000);
    }
  }, [navigate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/html': ['.html'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    disabled: uploading
  });

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      completed: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles[status] || statusStyles.pending}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Regulation Statement Extractor
              </h1>
              <p className="text-sm text-slate-600">Extract, map, and analyze regulatory requirements</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Upload Section */}
        <div className="mb-12 fade-in">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Upload Document</h2>
          <div
            {...getRootProps()}
            className={`dropzone ${
              isDragActive ? 'active' : ''
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            data-testid="document-upload-dropzone"
          >
            <input {...getInputProps()} data-testid="document-upload-input" />
            <div className="flex flex-col items-center gap-4">
              {uploading ? (
                <>
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                  <div className="text-center">
                    <p className="text-lg font-medium text-slate-700">{uploadProgress?.filename}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {uploadProgress?.status === 'uploading' && 'Processing document...'}
                      {uploadProgress?.status === 'success' && (
                        <span className="flex items-center gap-2 justify-center text-green-600">
                          <CheckCircle2 className="w-4 h-4" /> Upload successful!
                        </span>
                      )}
                      {uploadProgress?.status === 'error' && (
                        <span className="flex items-center gap-2 justify-center text-red-600">
                          <XCircle className="w-4 h-4" /> Upload failed
                        </span>
                      )}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-medium text-slate-700">
                      {isDragActive ? 'Drop file here' : 'Drag & drop a document'}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      or <span className="text-blue-600 font-medium">browse files</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-3">
                      Supports PDF, DOCX, HTML, TXT • Max 50MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-800">Your Documents</h2>
            <span className="text-sm text-slate-500">{documents.length} documents</span>
          </div>

          {documents.length === 0 ? (
            <div className="card text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No documents uploaded yet</p>
              <p className="text-sm text-slate-400 mt-1">Upload your first regulatory document to get started</p>
            </div>
          ) : (
            <div className="grid gap-4" data-testid="documents-list">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="card flex items-center justify-between cursor-pointer"
                  onClick={() => doc.parse_status === 'completed' && navigate(`/workspace/${doc.id}`)}
                  data-testid={`document-item-${doc.id}`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 truncate">{doc.filename}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                        <span>{formatDate(doc.upload_date)}</span>
                        <span>•</span>
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>•</span>
                        <span>{doc.total_statements} statements</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(doc.parse_status)}
                    {doc.parse_status === 'completed' && (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HomePage;