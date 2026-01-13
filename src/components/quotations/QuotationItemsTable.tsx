import type { QuotationItem } from '@/lib/api-quotation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface QuotationItemsTableProps {
  items: QuotationItem[];
  currencyCode?: string;
}

export default function QuotationItemsTable({ items, currencyCode = 'OMR' }: QuotationItemsTableProps) {
  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(3)} ${currencyCode}`;
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No items found
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="w-16">Line</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-center w-24">Quantity</TableHead>
            <TableHead className="w-24">Unit</TableHead>
            <TableHead className="text-right w-32">Unit Price</TableHead>
            <TableHead className="text-right w-32">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.QuotationItemID}>
              <TableCell className="text-center">{item.LineNumber}</TableCell>
              <TableCell>
                <div className="font-medium">{item.ItemDescription}</div>
                {item.Notes && (
                  <div className="text-xs text-slate-500 mt-1">{item.Notes}</div>
                )}
              </TableCell>
              <TableCell className="text-center">
                {item.Quantity} {item.UnitOfMeasure}
              </TableCell>
              <TableCell>{item.UnitOfMeasure}</TableCell>
              <TableCell className="text-right">{formatCurrency(item.UnitPrice)}</TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(item.TotalPrice)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
