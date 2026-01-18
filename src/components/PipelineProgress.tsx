import { CheckCircle, Circle, Clock } from 'lucide-react';

interface PipelineProgressProps {
  hasQuotation: boolean;
  hasLPO: boolean;
  hasDeliveryOrder: boolean;
  hasInvoice: boolean;
  hasPayment: boolean;
}

interface Step {
  key: string;
  label: string;
  completed: boolean;
}

export function PipelineProgress({
  hasQuotation,
  hasLPO,
  hasDeliveryOrder,
  hasInvoice,
  hasPayment,
}: PipelineProgressProps) {
  const steps: Step[] = [
    { key: 'Q', label: 'Q', completed: hasQuotation },
    { key: 'LPO', label: 'LPO', completed: hasLPO },
    { key: 'DO', label: 'DO', completed: hasDeliveryOrder },
    { key: 'INV', label: 'INV', completed: hasInvoice },
    { key: 'PAY', label: 'PAY', completed: hasPayment },
  ];

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, index) => (
        <div key={step.key} className="flex items-center">
          {/* Step Circle */}
          <div className="flex flex-col items-center">
            <div
              className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                step.completed
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-300 text-slate-600'
              }`}
            >
              {step.completed ? (
                <div className="w-3 h-3 bg-white rounded-full" />
              ) : (
                <div className="w-3 h-3 border-2 border-white rounded-full" />
              )}
            </div>
            <span
              className={`text-xs mt-1 font-medium ${
                step.completed ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              {step.label}
            </span>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={`h-0.5 w-8 mx-1 transition-colors ${
                step.completed && steps[index + 1].completed
                  ? 'bg-emerald-500'
                  : step.completed
                  ? 'bg-gradient-to-r from-emerald-500 to-slate-300'
                  : 'bg-slate-300'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
