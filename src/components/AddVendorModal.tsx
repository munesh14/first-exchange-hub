import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Building2 } from 'lucide-react';

interface AddVendorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultVendorName?: string;
  onSuccess?: (vendor: { VendorID: number; VendorName: string }) => void;
}

export function AddVendorModal({
  open,
  onOpenChange,
  defaultVendorName = '',
  onSuccess,
}: AddVendorModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    VendorName: defaultVendorName,
    ContactPerson: '',
    Phone: '',
    Email: '',
  });

  const mutation = useMutation({
    mutationFn: api.createVendor,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast({
        title: 'Vendor Added',
        description: `${formData.VendorName} has been added successfully.`,
      });
      onSuccess?.(data);
      onOpenChange(false);
      setFormData({ VendorName: '', ContactPerson: '', Phone: '', Email: '' });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add vendor. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.VendorName.trim()) return;
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-accent" />
            </div>
            Add New Vendor
          </DialogTitle>
          <DialogDescription>
            Add a new vendor to the system
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="vendorName">Vendor Name *</Label>
            <Input
              id="vendorName"
              value={formData.VendorName}
              onChange={(e) =>
                setFormData({ ...formData, VendorName: e.target.value })
              }
              placeholder="Enter vendor name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPerson">Contact Person</Label>
            <Input
              id="contactPerson"
              value={formData.ContactPerson}
              onChange={(e) =>
                setFormData({ ...formData, ContactPerson: e.target.value })
              }
              placeholder="Enter contact person name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.Phone}
                onChange={(e) =>
                  setFormData({ ...formData, Phone: e.target.value })
                }
                placeholder="+968 XXXX XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.Email}
                onChange={(e) =>
                  setFormData({ ...formData, Email: e.target.value })
                }
                placeholder="vendor@example.com"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Adding...' : 'Add Vendor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
