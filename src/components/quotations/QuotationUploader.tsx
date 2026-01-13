import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { uploadQuotationFile } from '@/lib/api-quotation';
import { getDepartments, getBranches, getCategories } from '@/lib/api-lpo';
import type { Department, Branch, Category } from '@/lib/api-lpo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface QuotationUploaderProps {
  onSuccess?: (quotationUuid: string) => void;
}

export default function QuotationUploader({ onSuccess }: QuotationUploaderProps) {
  const { currentUser } = useUser();
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [branchId, setBranchId] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    quotationUuid?: string;
  } | null>(null);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setDataLoading(true);
    try {
      const [branchesData, departmentsData, categoriesData] = await Promise.all([
        getBranches(),
        getDepartments(),
        getCategories(),
      ]);
      setBranches(Array.isArray(branchesData) ? branchesData : []);
      setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setDataLoading(false);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !departmentId || !currentUser) {
      alert('Please select a file and department');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const result = await uploadQuotationFile(file, {
        departmentId: parseInt(departmentId),
        branchId: branchId ? parseInt(branchId) : undefined,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        uploadedBy: currentUser.UserID,
        notes,
      });

      if (result.success) {
        setUploadResult({
          success: true,
          message: `Quotation uploaded successfully! ${result.quotationNumber}`,
          quotationUuid: result.quotationUuid,
        });

        // Reset form
        setFile(null);
        setNotes('');

        // Call success callback
        if (onSuccess && result.quotationUuid) {
          setTimeout(() => onSuccess(result.quotationUuid!), 2000);
        }
      } else {
        setUploadResult({
          success: false,
          message: result.error || 'Failed to upload quotation',
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        message: 'An error occurred while uploading',
      });
    }

    setUploading(false);
  };

  const filteredDepartments = branchId
    ? departments.filter(d => d.BranchID === parseInt(branchId))
    : departments;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Quotation
        </CardTitle>
        <CardDescription>
          Upload vendor quotation for AI extraction and processing
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="quotation-file">Quotation File (PDF)</Label>
          <div className="mt-1.5">
            <Input
              id="quotation-file"
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>
          {file && (
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <FileText className="w-4 h-4" />
              <span>{file.name} ({(file.size / 1024).toFixed(2)} KB)</span>
            </div>
          )}
        </div>

        <div>
          <Label>Branch (Optional)</Label>
          <Select value={branchId} onValueChange={setBranchId} disabled={uploading || dataLoading}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select branch..." />
            </SelectTrigger>
            <SelectContent>
              {branches.map(branch => (
                <SelectItem key={branch.BranchID} value={branch.BranchID.toString()}>
                  {branch.BranchName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Department *</Label>
          <Select value={departmentId} onValueChange={setDepartmentId} disabled={uploading || dataLoading}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select department..." />
            </SelectTrigger>
            <SelectContent>
              {filteredDepartments.map(dept => (
                <SelectItem key={dept.DepartmentID} value={dept.DepartmentID.toString()}>
                  {dept.DepartmentName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Category (Optional)</Label>
          <Select value={categoryId} onValueChange={setCategoryId} disabled={uploading || dataLoading}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select category..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.CategoryID} value={cat.CategoryID.toString()}>
                  {cat.CategoryName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this quotation..."
            rows={3}
            disabled={uploading}
            className="mt-1.5"
          />
        </div>

        {uploadResult && (
          <div className={`p-4 rounded-lg border ${
            uploadResult.success
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {uploadResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <p className={`text-sm font-medium ${
                uploadResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {uploadResult.message}
              </p>
            </div>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={uploading || !file || !departmentId}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading & Extracting...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Quotation
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
