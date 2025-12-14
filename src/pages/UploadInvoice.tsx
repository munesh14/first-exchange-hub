import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { api } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  Upload,
  FileText,
  Image,
  X,
  Loader2,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/heic': ['.heic'],
  'image/webp': ['.webp'],
};

export default function UploadInvoice() {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [departmentId, setDepartmentId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [notes, setNotes] = useState('');

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: api.getDepartments,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: api.getCategories,
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: {
      file: string;
      fileName: string;
      fileType: string;
      departmentId: number;
      userId: number;
      categoryId: number;
    }) => {
      return api.uploadInvoice(data);
    },
    onSuccess: (data) => {
      toast({
        title: 'Invoice Uploaded',
        description: 'AI extraction complete. Redirecting to review...',
      });
      navigate(`/invoice/${data.uuid}`);
    },
    onError: (error) => {
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload invoice. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !departmentId || !categoryId || !currentUser) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      uploadMutation.mutate({
        file: base64,
        fileName: file.name,
        fileType: file.type,
        departmentId: parseInt(departmentId),
        userId: currentUser.UserID,
        categoryId: parseInt(categoryId),
      });
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setFile(null);
  };

  const isImage = file?.type.startsWith('image/');

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <PageHeader
        title="Upload Invoice"
        description="Upload an invoice document for AI-powered data extraction"
        breadcrumbs={[{ label: 'Upload Invoice' }]}
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* File Upload Area */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Invoice Document</h2>

          {!file ? (
            <div
              {...getRootProps()}
              className={cn(
                'dropzone',
                isDragActive && 'dropzone-active',
                'hover:border-accent hover:bg-accent/5'
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-medium text-foreground">
                    {isDragActive
                      ? 'Drop your file here...'
                      : 'Drag & drop your invoice'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse • PDF, JPG, PNG, HEIC, WebP (max 10MB)
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-border rounded-xl p-4 bg-muted/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {isImage ? (
                    <Image className="w-6 h-6 text-primary" />
                  ) : (
                    <FileText className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {file.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {isImage && (
                <div className="mt-4 rounded-lg overflow-hidden border border-border">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Preview"
                    className="max-h-48 w-full object-contain bg-white"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Invoice Details */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Invoice Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {departments?.map((dept) => (
                    <SelectItem
                      key={dept.DepartmentID}
                      value={dept.DepartmentID.toString()}
                    >
                      {dept.DepartmentName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {categories?.map((cat) => (
                    <SelectItem
                      key={cat.CategoryID}
                      value={cat.CategoryID.toString()}
                    >
                      {cat.CategoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes or context..."
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!file || !departmentId || !categoryId || uploadMutation.isPending}
            className="gap-2"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                AI is extracting data...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Upload & Extract
              </>
            )}
          </Button>
        </div>

        {/* AI Processing Indicator */}
        {uploadMutation.isPending && (
          <div className="bg-accent/10 border border-accent/20 rounded-xl p-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-accent animate-pulse-soft" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              AI Processing Your Invoice
            </h3>
            <p className="text-muted-foreground">
              Our AI is analyzing your document and extracting invoice data.
              This usually takes 10-30 seconds...
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
