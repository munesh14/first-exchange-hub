import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface EditableLineItemsProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  currency?: string;
}

export function EditableLineItems({ items, onChange, currency = 'OMR' }: EditableLineItemsProps) {
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: keyof LineItem } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const handleCellClick = (rowId: string, field: keyof LineItem, currentValue: string | number) => {
    setEditingCell({ rowId, field });
    setEditValue(currentValue.toString());
  };

  const handleCellBlur = () => {
    if (editingCell) {
      saveEdit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      saveEdit();
      // Could implement tab navigation to next cell here
    }
  };

  const saveEdit = () => {
    if (!editingCell) return;

    const { rowId, field } = editingCell;
    const newItems = items.map(item => {
      if (item.id !== rowId) return item;

      let newValue: string | number = editValue;

      // Parse numeric fields
      if (field === 'quantity' || field === 'unitPrice') {
        const parsed = parseFloat(editValue);
        newValue = isNaN(parsed) ? 0 : parsed;
      }

      const updated = { ...item, [field]: newValue };

      // Recalculate total if quantity or unitPrice changed
      if (field === 'quantity' || field === 'unitPrice') {
        updated.total = updated.quantity * updated.unitPrice;
      }

      return updated;
    });

    onChange(newItems);
    setEditingCell(null);
    setEditValue('');
  };

  const handleAddRow = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    onChange([...items, newItem]);
  };

  const handleDeleteRow = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      onChange(items.filter(item => item.id !== deleteConfirm));
      setDeleteConfirm(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-OM', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  };

  return (
    <>
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 w-12">#</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Description</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-slate-700 w-24">Qty</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-slate-700 w-32">Unit Price</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-slate-700 w-32">Total</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700 w-16">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-500 italic">
                  No items added yet. Click "+ Add Row" to start.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-sm text-slate-600">{index + 1}</td>

                  {/* Description */}
                  <td className="px-3 py-2">
                    {editingCell?.rowId === item.id && editingCell.field === 'description' ? (
                      <Input
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellBlur}
                        onKeyDown={handleKeyDown}
                        className="h-8 text-sm"
                      />
                    ) : (
                      <div
                        onClick={() => handleCellClick(item.id, 'description', item.description)}
                        className="min-h-[32px] flex items-center text-sm text-slate-900 hover:bg-blue-50 px-2 py-1 rounded cursor-pointer"
                      >
                        {item.description || <span className="text-slate-400 italic">Click to edit</span>}
                      </div>
                    )}
                  </td>

                  {/* Quantity */}
                  <td className="px-3 py-2">
                    {editingCell?.rowId === item.id && editingCell.field === 'quantity' ? (
                      <Input
                        ref={inputRef}
                        type="number"
                        step="0.001"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellBlur}
                        onKeyDown={handleKeyDown}
                        className="h-8 text-sm text-right"
                      />
                    ) : (
                      <div
                        onClick={() => handleCellClick(item.id, 'quantity', item.quantity)}
                        className="min-h-[32px] flex items-center justify-end text-sm text-slate-900 hover:bg-blue-50 px-2 py-1 rounded cursor-pointer"
                      >
                        {item.quantity}
                      </div>
                    )}
                  </td>

                  {/* Unit Price */}
                  <td className="px-3 py-2">
                    {editingCell?.rowId === item.id && editingCell.field === 'unitPrice' ? (
                      <Input
                        ref={inputRef}
                        type="number"
                        step="0.001"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellBlur}
                        onKeyDown={handleKeyDown}
                        className="h-8 text-sm text-right"
                      />
                    ) : (
                      <div
                        onClick={() => handleCellClick(item.id, 'unitPrice', item.unitPrice)}
                        className="min-h-[32px] flex items-center justify-end text-sm text-slate-900 hover:bg-blue-50 px-2 py-1 rounded cursor-pointer"
                      >
                        {formatCurrency(item.unitPrice)}
                      </div>
                    )}
                  </td>

                  {/* Total (calculated, read-only) */}
                  <td className="px-3 py-2 text-right text-sm font-semibold text-slate-900">
                    {formatCurrency(item.total)}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2 text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteRow(item.id)}
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Row Button */}
      <div className="mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddRow}
          className="gap-2 border-dashed hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
        >
          <Plus className="w-4 h-4" />
          Add Row
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm !== null} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Line Item?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this line item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
