import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const StatementTable = ({ statements, columns, hiddenColumns, onUpdate, onSelectStatement, selectedStatement, selectedStatements = [], onToggleSelect }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [editingCell, setEditingCell] = useState(null);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedStatements = [...statements].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aVal = a[sortConfig.key] || a.custom_fields?.[sortConfig.key] || '';
    let bVal = b[sortConfig.key] || b.custom_fields?.[sortConfig.key] || '';

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleCellEdit = (statementId, columnName, value) => {
    const statement = statements.find(s => s.id === statementId);
    const updatedFields = { ...statement.custom_fields, [columnName]: value };
    onUpdate(statementId, updatedFields);
    setEditingCell(null);
  };

  const getStatementTypeBadge = (type) => {
    const styles = {
      Obligation: 'badge badge-obligation',
      Prohibition: 'badge badge-prohibition',
      Recommendation: 'badge badge-recommendation',
      Definition: 'badge badge-definition',
      Exception: 'badge badge-exception'
    };
    return <span className={styles[type] || 'badge'}>{type}</span>;
  };

  const getEditKindBadge = (kind) => {
    if (!kind || kind === 'original') return null;
    const styles = {
      split_child: 'bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded',
      merge_result: 'bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded',
      group_parent: 'bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded'
    };
    const labels = {
      split_child: 'Split',
      merge_result: 'Merged',
      group_parent: 'Group'
    };
    return <span className={styles[kind]}>{labels[kind]}</span>;
  };

  const handleRowClick = (stmt, e) => {
    if (e.ctrlKey || e.metaKey) {
      // Multi-select
      onToggleSelect?.(stmt);
    } else {
      onSelectStatement(stmt);
    }
  };

  const renderCell = (statement, column) => {
    const value = statement.custom_fields?.[column.name] || '';
    const isEditing = editingCell === `${statement.id}-${column.name}`;

    if (isEditing) {
      if (column.column_type === 'enum' && column.options) {
        return (
          <Select
            value={value}
            onValueChange={(val) => handleCellEdit(statement.id, column.name, val)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {column.options.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      if (column.column_type === 'checkbox') {
        return (
          <input
            type="checkbox"
            checked={value === true || value === 'true'}
            onChange={(e) => handleCellEdit(statement.id, column.name, e.target.checked)}
            className="w-4 h-4"
            autoFocus
          />
        );
      }

      return (
        <Input
          type={column.column_type === 'number' ? 'number' : column.column_type === 'date' ? 'date' : 'text'}
          value={value}
          onChange={(e) => handleCellEdit(statement.id, column.name, e.target.value)}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCellEdit(statement.id, column.name, e.target.value);
            if (e.key === 'Escape') setEditingCell(null);
          }}
          className="h-8 text-xs"
          autoFocus
        />
      );
    }

    if (column.column_type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={value === true || value === 'true'}
          onChange={(e) => handleCellEdit(statement.id, column.name, e.target.checked)}
          className="w-4 h-4"
        />
      );
    }

    return (
      <div
        onClick={() => setEditingCell(`${statement.id}-${column.name}`)}
        className="cursor-pointer hover:bg-slate-50 px-2 py-1 rounded min-h-[32px]"
      >
        {value || <span className="text-slate-400 text-xs">Click to edit</span>}
      </div>
    );
  };

  const baseColumns = [
    { key: 'hierarchy_path', label: 'Hierarchy Path', width: '200px' },
    { key: 'section_ref', label: 'Section Ref', width: '120px' },
    { key: 'section_title', label: 'Section Title', width: '180px' },
    { key: 'page_number', label: 'Page', width: '80px' },
    { key: 'regulation_text', label: 'Regulation Text', width: 'auto' },
    { key: 'statement_type', label: 'Type', width: '140px' }
  ];

  const visibleBaseColumns = baseColumns.filter(col => !hiddenColumns.includes(col.key));
  const visibleCustomColumns = columns.filter(col => !hiddenColumns.includes(col.name));

  return (
    <div className="table-wrapper" data-testid="statement-table">
      <table>
        <thead>
          <tr>
            {visibleBaseColumns.map(col => (
              <th
                key={col.key}
                style={{ width: col.width }}
                onClick={() => handleSort(col.key)}
                className="cursor-pointer hover:bg-slate-200"
              >
                <div className="flex items-center justify-between">
                  <span>{col.label}</span>
                  {sortConfig.key === col.key && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
            ))}
            {visibleCustomColumns.map(col => (
              <th
                key={col.id}
                onClick={() => handleSort(col.name)}
                className="cursor-pointer hover:bg-slate-200"
              >
                <div className="flex items-center justify-between">
                  <span>{col.name}</span>
                  {sortConfig.key === col.name && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedStatements.map(stmt => (
            <tr
              key={stmt.id}
              className={`${
                selectedStatements.some(s => s.sys_id === stmt.sys_id) ? 'bg-blue-100' :
                selectedStatement?.id === stmt.id ? 'bg-blue-50' : 
                stmt.is_superseded ? 'opacity-50' : ''
              } ${stmt.user_edit_kind === 'group_parent' ? 'font-medium' : ''}`}
              onClick={(e) => handleRowClick(stmt, e)}
              data-testid={`statement-row-${stmt.id}`}
            >
              {!hiddenColumns.includes('hierarchy_path') && (
                <td className="text-xs font-mono">{stmt.hierarchy_path}</td>
              )}
              {!hiddenColumns.includes('section_ref') && (
                <td className="text-xs font-medium">{stmt.section_ref}</td>
              )}
              {!hiddenColumns.includes('section_title') && (
                <td className="text-xs">{stmt.section_title || '-'}</td>
              )}
              {!hiddenColumns.includes('page_number') && (
                <td className="text-xs text-center">{stmt.page_number || '-'}</td>
              )}
              {!hiddenColumns.includes('regulation_text') && (
                <td className="text-sm max-w-xl">
                  <div className="line-clamp-3">{stmt.regulation_text}</div>
                </td>
              )}
              {!hiddenColumns.includes('statement_type') && (
                <td>{getStatementTypeBadge(stmt.statement_type)}</td>
              )}
              {visibleCustomColumns.map(col => (
                <td key={col.id} onClick={(e) => e.stopPropagation()}>
                  {renderCell(stmt, col)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {sortedStatements.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No statements found
        </div>
      )}
    </div>
  );
};

export default StatementTable;