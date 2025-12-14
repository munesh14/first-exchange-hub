import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, User } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Building2, User as UserIcon, AlertCircle, Loader2 } from 'lucide-react';

export function UserSelectModal() {
  const { isUserModalOpen, setIsUserModalOpen, setCurrentUser, currentUser } = useUser();
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const { data: users, isLoading, error, isError } = useQuery({
    queryKey: ['users'],
    queryFn: api.getUsers,
    retry: 2,
    retryDelay: 1000,
  });

  useEffect(() => {
    if (currentUser) {
      setSelectedUserId(currentUser.UserID.toString());
    }
  }, [currentUser]);

  const handleConfirm = () => {
    const user = users?.find((u) => u.UserID.toString() === selectedUserId);
    if (user) {
      setCurrentUser(user);
      setIsUserModalOpen(false);
    }
  };

  const selectedUser = users?.find((u) => u.UserID.toString() === selectedUserId);

  return (
    <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-primary-foreground" />
            </div>
            Who are you?
          </DialogTitle>
          <DialogDescription>
            Select your name to continue to the Invoice System
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Failed to load users from API</p>
                <p className="text-muted-foreground mt-1">
                  {error instanceof Error ? error.message : 'Unknown error'}
                </p>
                <p className="text-muted-foreground mt-1">Using test users instead.</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Select User
            </label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={isLoading}>
              <SelectTrigger className="w-full">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading users...</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Choose your name..." />
                )}
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {isLoading ? (
                  <div className="p-4 text-center text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading users...
                  </div>
                ) : (
                  users?.map((user) => (
                    <SelectItem key={user.UserID} value={user.UserID.toString()}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.FullName}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          {user.DepartmentName}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedUser && (
            <div className="p-4 rounded-xl bg-muted/50 border border-border/50 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{selectedUser.FullName}</p>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Building2 className="w-3.5 h-3.5" />
                    {selectedUser.DepartmentName}
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleConfirm}
            disabled={!selectedUserId || isLoading}
            className="w-full"
            size="lg"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
