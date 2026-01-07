'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { loansApi, ApplyLoanRequest, CalculatePaymentResponse } from '@/lib/api/loans';
import { accountsApi } from '@/lib/api/accounts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Calculator, DollarSign, Calendar, Percent, Shield, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';

const loanSchema = z.object({
  accountId: z.string().min(1, 'Please select an account'),
  purpose: z.enum(['PERSONAL', 'MORTGAGE', 'AUTO', 'STUDENT']).refine((val) => val !== undefined, {
    message: 'Please select a loan type',
  }),
  requestedAmount: z.number().min(1000, 'Minimum loan amount is €1,000').max(500000, 'Maximum loan amount is €500,000'),
  termMonths: z.number().min(6, 'Minimum term is 6 months').max(360, 'Maximum term is 30 years'),
});

type LoanFormData = z.infer<typeof loanSchema>;

// Interest rates by loan type (as percentages for display)
const interestRatesPercent: Record<string, number> = {
  PERSONAL: 7.5,
  MORTGAGE: 3.5,
  AUTO: 5.5,
  STUDENT: 4.0,
};

// Insurance rates by loan type (as percentages for display)
const insuranceRatesPercent: Record<string, number> = {
  PERSONAL: 0.5,
  MORTGAGE: 0.3,
  AUTO: 0.4,
  STUDENT: 0.2,
};

export default function ApplyLoanPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [paymentDetails, setPaymentDetails] = useState<CalculatePaymentResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const { data: accounts } = useQuery({
    queryKey: ['accounts', user?.id],
    queryFn: () => accountsApi.getUserAccounts(user!.id),
    enabled: !!user?.id,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      requestedAmount: 10000,
      termMonths: 24,
    },
  });

  const watchAmount = watch('requestedAmount');
  const watchTerm = watch('termMonths');
  const watchPurpose = watch('purpose');

  // Calculate payment using backend API when values change
  useEffect(() => {
    const calculatePayment = async () => {
      if (watchAmount && watchTerm && watchPurpose) {
        setIsCalculating(true);
        try {
          // Convert percentage to decimal (e.g., 7.5% -> 0.075)
          const annualRate = (interestRatesPercent[watchPurpose] || 5) / 100;
          const insuranceRate = (insuranceRatesPercent[watchPurpose] || 0.5) / 100;
          
          const result = await loansApi.calculatePayment({
            principal: watchAmount,
            annualRate,
            termMonths: watchTerm,
            insuranceRate,
          });
          
          setPaymentDetails(result);
        } catch (error) {
          console.error('Failed to calculate payment:', error);
          // Fallback to local calculation
          const annualRate = (interestRatesPercent[watchPurpose] || 5) / 100;
          const monthlyRate = annualRate / 12;
          const payment = (watchAmount * monthlyRate * Math.pow(1 + monthlyRate, watchTerm)) /
            (Math.pow(1 + monthlyRate, watchTerm) - 1);
          
          setPaymentDetails({
            monthlyPayment: isNaN(payment) ? 0 : Number(payment.toFixed(2)),
            monthlyPaymentWithoutInsurance: isNaN(payment) ? 0 : Number(payment.toFixed(2)),
            monthlyInsurance: 0,
            totalAmount: isNaN(payment) ? 0 : Number((payment * watchTerm).toFixed(2)),
            totalInterest: isNaN(payment) ? 0 : Number((payment * watchTerm - watchAmount).toFixed(2)),
            totalInsurance: 0,
          });
        } finally {
          setIsCalculating(false);
        }
      }
    };

    // Debounce calculation
    const timeoutId = setTimeout(calculatePayment, 300);
    return () => clearTimeout(timeoutId);
  }, [watchAmount, watchTerm, watchPurpose]);

  const applyMutation = useMutation({
    mutationFn: (data: ApplyLoanRequest) => loansApi.applyForLoan(data),
    onSuccess: () => {
      toast.success('Loan application submitted successfully!');
      router.push('/loans');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit application');
    },
  });

  const onSubmit = (data: LoanFormData) => {
    applyMutation.mutate({
      userId: user!.id,
      accountId: data.accountId,
      purpose: data.purpose,
      requestedAmount: data.requestedAmount,
      termMonths: data.termMonths,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <Link href="/loans">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Loans
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Apply for a Loan</h1>
        <p className="text-gray-500">Fill out the form below to submit your loan application</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Loan Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Loan Details</CardTitle>
            <CardDescription>Customize your loan parameters</CardDescription>
          </CardHeader>
          <CardContent>
            {!accounts || accounts.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You need a bank account to apply for a loan.{' '}
                  <Link href="/accounts/open" className="text-blue-600 hover:underline">
                    Open one now
                  </Link>
                </AlertDescription>
              </Alert>
            ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Account Selection */}
              <div className="space-y-2">
                <Label>Disbursement Account</Label>
                <Select onValueChange={(value) => setValue('accountId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts?.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name || account.accountType} - {account.iban.slice(-8)} ({formatCurrency(account.balance, account.currency)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.accountId && (
                  <p className="text-sm text-red-500">{errors.accountId.message}</p>
                )}
              </div>

              {/* Loan Type */}
              <div className="space-y-2">
                <Label>Loan Type</Label>
                <Select onValueChange={(value) => setValue('purpose', value as 'PERSONAL' | 'MORTGAGE' | 'AUTO' | 'STUDENT')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select loan type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERSONAL">Personal Loan (7.5% APR)</SelectItem>
                    <SelectItem value="MORTGAGE">Mortgage (3.5% APR)</SelectItem>
                    <SelectItem value="AUTO">Auto Loan (5.5% APR)</SelectItem>
                    <SelectItem value="STUDENT">Student Loan (4.0% APR)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.purpose && (
                  <p className="text-sm text-red-500">{errors.purpose.message}</p>
                )}
              </div>

              {/* Loan Amount */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Loan Amount</Label>
                  <span className="text-2xl font-bold">{formatCurrency(watchAmount || 0, 'EUR')}</span>
                </div>
                <Slider
                  value={[watchAmount || 10000]}
                  onValueChange={(value) => setValue('requestedAmount', value[0])}
                  min={1000}
                  max={500000}
                  step={1000}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>€1,000</span>
                  <span>€500,000</span>
                </div>
                <Input
                  type="number"
                  {...register('requestedAmount', { valueAsNumber: true })}
                  className="mt-2"
                />
                {errors.requestedAmount && (
                  <p className="text-sm text-red-500">{errors.requestedAmount.message}</p>
                )}
              </div>

              {/* Loan Term */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Loan Term</Label>
                  <span className="text-2xl font-bold">
                    {watchTerm || 0} months
                    <span className="text-sm text-gray-500 ml-2">
                      ({((watchTerm || 0) / 12).toFixed(1)} years)
                    </span>
                  </span>
                </div>
                <Slider
                  value={[watchTerm || 24]}
                  onValueChange={(value) => setValue('termMonths', value[0])}
                  min={6}
                  max={360}
                  step={6}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>6 months</span>
                  <span>30 years</span>
                </div>
                {errors.termMonths && (
                  <p className="text-sm text-red-500">{errors.termMonths.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={applyMutation.isPending}
              >
                {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
              </Button>
            </form>
            )}
          </CardContent>
        </Card>

        {/* Payment Calculator */}
        <div className="space-y-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Payment Calculator
                {isCalculating && <span className="text-xs text-gray-500">(calculating...)</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Monthly Payment</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(paymentDetails?.monthlyPayment || 0, 'EUR')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="h-4 w-4" />
                  <span>Total Payment</span>
                </div>
                <span className="font-semibold">
                  {formatCurrency(paymentDetails?.totalAmount || 0, 'EUR')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Percent className="h-4 w-4" />
                  <span>Total Interest</span>
                </div>
                <span className="font-semibold text-orange-600">
                  {formatCurrency(paymentDetails?.totalInterest || 0, 'EUR')}
                </span>
              </div>

              {paymentDetails?.totalInsurance !== undefined && paymentDetails.totalInsurance > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Shield className="h-4 w-4" />
                    <span>Total Insurance</span>
                  </div>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(paymentDetails.totalInsurance, 'EUR')}
                  </span>
                </div>
              )}

              {watchPurpose && (
                <div className="pt-4 border-t space-y-1">
                  <p className="text-sm text-gray-600">
                    Interest Rate: <span className="font-semibold">{interestRatesPercent[watchPurpose]}% APR</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Insurance Rate: <span className="font-semibold">{insuranceRatesPercent[watchPurpose]}%</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Important Information</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>• Loan approval is subject to credit assessment</p>
              <p>• Interest rates may vary based on your credit score</p>
              <p>• Early repayment options available</p>
              <p>• Insurance is included in the monthly payment</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
