import { Split, Merge, FolderPlus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const StatementToolbar = ({ 
  selectedStatements, 
  onSplit, 
  onMerge, 
  onGroup, 
  onDelete,
  onMoveUp,
  onMoveDown,
  canMerge,
  canGroup 
}) => {
  if (selectedStatements.length === 0) return null;

  const singleSelected = selectedStatements.length === 1;
  const multipleSelected = selectedStatements.length > 1;

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white border border-slate-300 rounded-lg shadow-lg px-4 py-3 flex items-center gap-2 z-50">
      <span className="text-sm text-slate-600 mr-2">
        {selectedStatements.length} selected
      </span>
      
      <div className="border-l border-slate-300 h-6 mx-2"></div>

      <TooltipProvider>
        {singleSelected && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={onSplit}
                className="gap-2"
                data-testid="split-button"
              >
                <Split className="w-4 h-4" />
                Split
              </Button>
            </TooltipTrigger>
            <TooltipContent>Split statement into parts (S)</TooltipContent>
          </Tooltip>
        )}

        {multipleSelected && canMerge && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={onMerge}
                className="gap-2"
                data-testid="merge-button"
              >
                <Merge className="w-4 h-4" />
                Merge
              </Button>
            </TooltipTrigger>
            <TooltipContent>Merge selected statements (M)</TooltipContent>
          </Tooltip>
        )}

        {multipleSelected && canGroup && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={onGroup}
                className="gap-2"
                data-testid="group-button"
              >
                <FolderPlus className="w-4 h-4" />
                Group
              </Button>
            </TooltipTrigger>
            <TooltipContent>Create group (G)</TooltipContent>
          </Tooltip>
        )}

        <div className="border-l border-slate-300 h-6 mx-2"></div>

        {singleSelected && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onMoveUp}
                  data-testid="move-up-button"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Move up ([)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onMoveDown}
                  data-testid="move-down-button"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Move down (])</TooltipContent>
            </Tooltip>
          </>
        )}
      </TooltipProvider>

      <Button
        size="sm"
        variant="ghost"
        onClick={onDelete}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        data-testid="delete-selected-button"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default StatementToolbar;