import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, Report } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { format, startOfWeek, getYear, getMonth } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Download,
  FileSpreadsheet,
  FileText,
  BarChart3,
  PieChart,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Navigate } from 'react-router-dom';

const CHART_COLORS = [
  'hsl(175, 58%, 39%)',
  'hsl(213, 56%, 24%)',
  'hsl(48, 96%, 50%)',
  'hsl(142, 72%, 40%)',
  'hsl(0, 72%, 51%)',
  'hsl(280, 70%, 50%)',
];

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function Reports() {
  const { canAccessReports } = useUser();
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState(getMonth(new Date()) + 1);
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()));
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Redirect if no access
  if (!canAccessReports) {
    return <Navigate to="/" replace />;
  }

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: api.getDepartments,
  });

  const getReportParams = () => {
    const deptId = departmentFilter !== 'all' ? parseInt(departmentFilter) : undefined;
    
    if (reportType === 'daily') {
      return { date: format(selectedDate, 'yyyy-MM-dd'), departmentId: deptId };
    } else if (reportType === 'weekly') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
      return { weekStart: format(weekStart, 'yyyy-MM-dd'), departmentId: deptId };
    } else {
      return { year: selectedYear, month: selectedMonth, departmentId: deptId };
    }
  };

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', reportType, getReportParams()],
    queryFn: () => {
      const params = getReportParams();
      if (reportType === 'daily') {
        return api.getDailyReport(params.date!, params.departmentId);
      } else if (reportType === 'weekly') {
        return api.getWeeklyReport(params.weekStart!, params.departmentId);
      } else {
        return api.getMonthlyReport(params.year!, params.month!, params.departmentId);
      }
    },
  });

  const exportToExcel = () => {
    if (!report) return;

    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = report.summary.map((s) => ({
      Department: s.DepartmentName,
      'Invoice Count': s.InvoiceCount,
      'Total Amount': s.TotalAmountOMR.toFixed(3),
    }));
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // By Category sheet
    const categoryData = report.byCategory.map((c) => ({
      Department: c.DepartmentName,
      Category: c.CategoryName,
      'Invoice Count': c.InvoiceCount,
      'Total Amount': c.TotalAmountOMR.toFixed(3),
    }));
    const categoryWs = XLSX.utils.json_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(wb, categoryWs, 'By Category');

    // By Vendor sheet
    const vendorData = report.byVendor.map((v) => ({
      Department: v.DepartmentName,
      Vendor: v.VendorName,
      'Invoice Count': v.InvoiceCount,
      'Total Amount': v.TotalAmountOMR.toFixed(3),
    }));
    const vendorWs = XLSX.utils.json_to_sheet(vendorData);
    XLSX.utils.book_append_sheet(wb, vendorWs, 'By Vendor');

    // Detail sheet
    if (report.detail && report.detail.length > 0) {
      const detailData = report.detail.map((d) => ({
        'Invoice #': d.InvoiceNumber,
        Date: d.InvoiceDate,
        Department: d.DepartmentName,
        Vendor: d.VendorName,
        Currency: d.CurrencyCode,
        Amount: d.TotalAmount.toFixed(3),
        Status: d.StatusCode,
      }));
      const detailWs = XLSX.utils.json_to_sheet(detailData);
      XLSX.utils.book_append_sheet(wb, detailWs, 'Detail');
    }

    XLSX.writeFile(wb, `invoice-report-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportToPDF = () => {
    if (!report) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(26, 54, 93); // Primary color
    doc.text('First Exchange LLC', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`Invoice Report - ${report.monthName || report.date || report.weekStart}`, pageWidth / 2, 30, { align: 'center' });

    // Summary stats
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Invoices: ${report.totalInvoices}`, 14, 45);
    doc.text(`Total Amount: ${report.totalAmountOMR.toFixed(3)}`, 14, 52);

    // Summary table
    autoTable(doc, {
      startY: 60,
      head: [['Department', 'Invoice Count', 'Total Amount']],
      body: report.summary.map((s) => [
        s.DepartmentName,
        s.InvoiceCount.toString(),
        s.TotalAmountOMR.toFixed(3),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [26, 54, 93] },
    });

    // By Category table
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('By Category', 14, finalY);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Category', 'Invoice Count', 'Total Amount']],
      body: report.byCategory.map((c) => [
        c.CategoryName,
        c.InvoiceCount.toString(),
        c.TotalAmountOMR.toFixed(3),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [49, 151, 149] },
    });

    doc.save(`invoice-report-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const chartData = report?.summary.map((s) => ({
    name: s.DepartmentName,
    value: s.TotalAmountOMR,
    count: s.InvoiceCount,
  })) || [];

  const categoryChartData = report?.byCategory.map((c) => ({
    name: c.CategoryName,
    value: c.TotalAmountOMR,
  })) || [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Reports"
        description="Generate and export invoice reports"
        breadcrumbs={[{ label: 'Reports' }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToExcel} disabled={!report} className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </Button>
            <Button variant="outline" onClick={exportToPDF} disabled={!report} className="gap-2">
              <FileText className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        }
      />

      {/* Report Type Selection */}
      <Tabs value={reportType} onValueChange={(v) => setReportType(v as 'daily' | 'weekly' | 'monthly')}>
        <TabsList className="mb-6">
          <TabsTrigger value="daily">Daily Report</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Report</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Report</TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            {reportType === 'daily' && (
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-start gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      {format(selectedDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {reportType === 'weekly' && (
              <div className="space-y-2">
                <Label>Week Starting</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-start gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      {format(startOfWeek(selectedDate, { weekStartsOn: 0 }), 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {reportType === 'monthly' && (
              <>
                <div className="space-y-2">
                  <Label>Month</Label>
                  <Select
                    value={selectedMonth.toString()}
                    onValueChange={(v) => setSelectedMonth(parseInt(v))}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {MONTHS.map((month, index) => (
                        <SelectItem key={index} value={(index + 1).toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(v) => setSelectedYear(parseInt(v))}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {[2023, 2024, 2025].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.DepartmentID} value={dept.DepartmentID.toString()}>
                      {dept.DepartmentName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Report Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : report ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{report.totalInvoices}</p>
                    <p className="text-sm text-muted-foreground">Total Invoices</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">
                      {report.totalAmountOMR.toLocaleString('en-OM', { minimumFractionDigits: 3 })}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* By Department Bar Chart */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-muted-foreground" />
                  By Department
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: number) => [value.toFixed(3), 'Amount']}
                      />
                      <Bar dataKey="value" fill="hsl(175, 58%, 39%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* By Category Pie Chart */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-muted-foreground" />
                  By Category
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                      >
                        {categoryChartData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [value.toFixed(3), 'Amount']}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Vendor Table */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">By Vendor</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th>Department</th>
                      <th>Invoice Count</th>
                      <th>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.byVendor.map((v, i) => (
                      <tr key={i}>
                        <td className="font-medium">{v.VendorName}</td>
                        <td>{v.DepartmentName}</td>
                        <td>{v.InvoiceCount}</td>
                        <td className="font-medium">
                          {v.TotalAmountOMR.toLocaleString('en-OM', { minimumFractionDigits: 3 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No data available for the selected period</p>
          </div>
        )}
      </Tabs>
    </div>
  );
}
