import { useState } from 'react';
import { Upload, Download, Plus, Trash2, Merge, Split, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState(['reference', 'text']);
  const [selectedRows, setSelectedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [showAddCol, setShowAddCol] = useState(false);

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Extraction failed');

      const data = await response.json();
      const extractedRows = data.map(item => ({
        id: uuidv4(),
        reference: item.reference || '',
        text: item.text || '',
      }));

      setRows(extractedRows);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to extract PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  const handleCellChange = (rowId, column, value) => {
    setRows(rows.map(row => 
      row.id === rowId ? { ...row, [column]: value } : row
    ));
  };

  const addRow = () => {
    const newRow = { id: uuidv4() };
    columns.forEach(col => { newRow[col] = ''; });
    setRows([...rows, newRow]);
  };

  const deleteRows = () => {
    setRows(rows.filter(row => !selectedRows.includes(row.id)));
    setSelectedRows([]);
  };

  const mergeRows = () => {
    if (selectedRows.length < 2) return;

    const selected = rows.filter(row => selectedRows.includes(row.id));
    const mergedText = selected.map(r => r.text).join(' ');
    const mergedRef = selected.map(r => r.reference).filter(Boolean).join(', ');

    const newRow = {
      id: uuidv4(),
      reference: mergedRef,
      text: mergedText,
    };

    columns.forEach(col => {
      if (col !== 'reference' && col !== 'text') {
        newRow[col] = selected[0][col] || '';
      }
    });

    setRows([...rows.filter(row => !selectedRows.includes(row.id)), newRow]);
    setSelectedRows([]);
  };

  const splitRow = () => {
    if (selectedRows.length !== 1) return;

    const row = rows.find(r => r.id === selectedRows[0]);
    if (!row) return;

    const sentences = row.text.match(/[^.!?]+[.!?]+/g) || [row.text];
    const newRows = sentences.map((sentence, idx) => ({
      id: uuidv4(),
      reference: `${row.reference}-${idx + 1}`,
      text: sentence.trim(),
      ...Object.fromEntries(
        columns.filter(c => c !== 'reference' && c !== 'text').map(c => [c, row[c]])
      ),
    }));

    setRows([...rows.filter(r => r.id !== row.id), ...newRows]);
    setSelectedRows([]);
  };

  const addColumn = () => {
    if (!newColName.trim()) return;
    if (columns.includes(newColName)) return;

    setColumns([...columns, newColName]);
    setRows(rows.map(row => ({ ...row, [newColName]: '' })));
    setNewColName('');
    setShowAddCol(false);
  };

  const deleteColumn = (col) => {
    if (col === 'reference' || col === 'text') return;
    setColumns(columns.filter(c => c !== col));
    setRows(rows.map(row => {
      const { [col]: _, ...rest } = row;
      return rest;
    }));
  };

  const exportCSV = () => {
    if (rows.length === 0) return;

    const header = columns.join(',');
    const csvRows = rows.map(row =>
      columns.map(col => `"${(row[col] || '').replace(/"/g, '""')}"`).join(',')
    );

    const csv = [header, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'regulation-export.csv';
    a.click();
  };

  const clearWorkspace = () => {
    if (confirm('Clear all data?')) {
      setRows([]);
      setColumns(['reference', 'text']);
      setSelectedRows([]);
    }
  };

  const toggleRowSelection = (rowId) => {
    setSelectedRows(prev =>
      prev.includes(rowId) ? prev.filter(id => id !== rowId) : [...prev, rowId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Regulation Extractor</h1>
          <p className="text-sm text-gray-600 mt-1">Upload PDF and extract structured regulation clauses</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          {loading ? (
            <p className="text-gray-600">Processing PDF...</p>
          ) : (
            <>
              <p className="text-lg text-gray-700 mb-2">
                {isDragActive ? 'Drop PDF here' : 'Drag & drop PDF here'}
              </p>
              <p className="text-sm text-gray-500">or click to browse</p>
            </>
          )}
        </div>

        {/* Toolbar */}
        {rows.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mt-6 flex flex-wrap gap-3 items-center">
            <button
              onClick={addRow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </button>

            <button
              onClick={() => setShowAddCol(!showAddCol)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <Plus className="w-4 h-4" />
              Add Column
            </button>

            {selectedRows.length > 0 && (
              <>
                <button
                  onClick={deleteRows}
                  className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedRows.length})
                </button>

                {selectedRows.length >= 2 && (
                  <button
                    onClick={mergeRows}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    <Merge className="w-4 h-4" />
                    Merge
                  </button>
                )}

                {selectedRows.length === 1 && (
                  <button
                    onClick={splitRow}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    <Split className="w-4 h-4" />
                    Split
                  </button>
                )}
              </>
            )}

            <div className="ml-auto flex gap-3">
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>

              <button
                onClick={clearWorkspace}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Add Column Input */}
        {showAddCol && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mt-4">
            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addColumn()}
                placeholder="Column name"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addColumn}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddCol(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {rows.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg mt-6 overflow-hidden">
            <div className="table-scroll">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-12 px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === rows.length}
                        onChange={(e) =>
                          setSelectedRows(e.target.checked ? rows.map(r => r.id) : [])
                        }
                        className="w-4 h-4"
                      />
                    </th>
                    {columns.map(col => (
                      <th key={col} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="capitalize">{col}</span>
                          {col !== 'reference' && col !== 'text' && (
                            <button
                              onClick={() => deleteColumn(col)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr
                      key={row.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        selectedRows.includes(row.id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(row.id)}
                          onChange={() => toggleRowSelection(row.id)}
                          className="w-4 h-4"
                        />
                      </td>
                      {columns.map(col => (
                        <td key={col} className="px-4 py-3">
                          {col === 'text' ? (
                            <textarea
                              value={row[col] || ''}
                              onChange={(e) => handleCellChange(row.id, col, e.target.value)}
                              className="w-full min-h-[60px] px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          ) : (
                            <input
                              type="text"
                              value={row[col] || ''}
                              onChange={(e) => handleCellChange(row.id, col, e.target.value)}
                              className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {rows.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <p>No data yet. Upload a PDF to get started.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;