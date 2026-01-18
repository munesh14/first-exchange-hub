import { CheckCircle, Circle, Clock, FileText, ClipboardList, Truck, Receipt, CreditCard } from 'lucide-react';

export interface WorkflowProgressProps {
  documents: {
    quotations: number;
    lpos: number;
    lpoApproved: boolean;
    deliveryOrders: number;
    doReceived: boolean;
    invoices: number;
    invoiceApproved: boolean;
    payments: number;
    fullyPaid: boolean;
  };
  status: string;
}

interface Step {
  key: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'pending';
  statusLabel: string;
}

export function WorkflowProgress({ documents, status }: WorkflowProgressProps) {
  // Determine step statuses
  const steps: Step[] = [
    {
      key: 'quotation',
      label: 'Quotation',
      shortLabel: 'Q',
      icon: <FileText className="w-4 h-4" />,
      status: documents.quotations > 0 ? 'completed' : 'current',
      statusLabel: documents.quotations > 0 ? 'Uploaded' : 'NEXT',
    },
    {
      key: 'lpo',
      label: 'LPO',
      shortLabel: 'LPO',
      icon: <ClipboardList className="w-4 h-4" />,
      status: documents.lpoApproved
        ? 'completed'
        : documents.lpos > 0
        ? 'current'
        : documents.quotations > 0
        ? 'current'
        : 'pending',
      statusLabel: documents.lpoApproved
        ? 'Approved'
        : documents.lpos > 0
        ? 'Pending Approval'
        : documents.quotations > 0
        ? 'NEXT'
        : 'Waiting',
    },
    {
      key: 'delivery',
      label: 'Delivery',
      shortLabel: 'DO',
      icon: <Truck className="w-4 h-4" />,
      status: documents.doReceived
        ? 'completed'
        : documents.deliveryOrders > 0
        ? 'current'
        : documents.lpoApproved
        ? 'current'
        : 'pending',
      statusLabel: documents.doReceived
        ? 'Received'
        : documents.deliveryOrders > 0
        ? 'Partial'
        : documents.lpoApproved
        ? 'NEXT'
        : 'Waiting',
    },
    {
      key: 'invoice',
      label: 'Invoice',
      shortLabel: 'INV',
      icon: <Receipt className="w-4 h-4" />,
      status: documents.invoiceApproved
        ? 'completed'
        : documents.invoices > 0
        ? 'current'
        : documents.doReceived
        ? 'current'
        : 'pending',
      statusLabel: documents.invoiceApproved
        ? 'Approved'
        : documents.invoices > 0
        ? 'Pending Approval'
        : documents.doReceived
        ? 'NEXT'
        : 'Waiting',
    },
    {
      key: 'payment',
      label: 'Payment',
      shortLabel: 'PAY',
      icon: <CreditCard className="w-4 h-4" />,
      status: documents.fullyPaid
        ? 'completed'
        : documents.payments > 0
        ? 'current'
        : documents.invoiceApproved
        ? 'current'
        : 'pending',
      statusLabel: documents.fullyPaid
        ? 'Paid'
        : documents.payments > 0
        ? 'Partial'
        : documents.invoiceApproved
        ? 'NEXT'
        : 'Waiting',
    },
  ];

  return (
    <div className="relative py-8">
      {/* Connecting lines */}
      <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 hidden lg:flex items-center px-16">
        <div className="flex-1 h-0.5 bg-slate-200 mx-2" />
      </div>

      <div className="relative grid grid-cols-5 gap-2 lg:gap-4">
        {steps.map((step, index) => {
          const getStepStyles = () => {
            switch (step.status) {
              case 'completed':
                return {
                  container: 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg',
                  ring: '',
                  statusBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                };
              case 'current':
                return {
                  container: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg animate-pulse',
                  ring: 'ring-4 ring-blue-200',
                  statusBg: 'bg-blue-100 text-blue-700 border-blue-200 font-semibold',
                };
              default:
                return {
                  container: 'bg-slate-100 text-slate-400 border-2 border-dashed border-slate-300',
                  ring: '',
                  statusBg: 'bg-slate-100 text-slate-500 border-slate-200',
                };
            }
          };

          const styles = getStepStyles();

          return (
            <div key={step.key} className="flex flex-col items-center">
              {/* Step circle */}
              <div className="relative mb-3">
                <div
                  className={`relative z-10 w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center ${styles.container} ${styles.ring} transition-all duration-300`}
                >
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-6 h-6 lg:w-7 lg:h-7" />
                  ) : step.status === 'current' ? (
                    step.icon
                  ) : (
                    <Circle className="w-5 h-5 lg:w-6 lg:h-6" />
                  )}
                </div>
              </div>

              {/* Step label */}
              <p
                className={`text-xs lg:text-sm font-semibold mb-1 ${
                  step.status === 'completed'
                    ? 'text-emerald-700'
                    : step.status === 'current'
                    ? 'text-blue-700'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </p>

              {/* Status badge */}
              <div
                className={`text-[10px] lg:text-xs px-2 py-0.5 rounded-full border ${styles.statusBg}`}
              >
                {step.statusLabel}
              </div>

              {/* Connector line between steps (mobile only) */}
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 top-7 w-full h-0.5 bg-slate-200 lg:hidden -z-10" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
