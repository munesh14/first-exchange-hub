import { cn } from '@/lib/utils';

type StatusType =
  | 'PENDING_REVIEW'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'CORRECTION_NEEDED'
  | 'PROCESSED';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  PENDING_REVIEW: {
    label: 'Pending Review',
    className: 'status-pending-review',
  },
  PENDING_APPROVAL: {
    label: 'Pending Approval',
    className: 'status-pending-approval',
  },
  APPROVED: {
    label: 'Approved',
    className: 'status-approved',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'status-rejected',
  },
  CORRECTION_NEEDED: {
    label: 'Correction Needed',
    className: 'status-correction',
  },
  PROCESSED: {
    label: 'Processed',
    className: 'status-processed',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (!status) {
    return (
      <span className={cn('status-badge', 'bg-gray-100 text-gray-800', className)}>
        Unknown
      </span>
    );
  }

  const config = statusConfig[status as StatusType] || {
    label: status.replace(/_/g, ' '),
    className: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={cn('status-badge', config.className, className)}>
      {config.label}
    </span>
  );
}
