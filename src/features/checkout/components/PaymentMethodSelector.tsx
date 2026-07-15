'use client'

export function PaymentMethodSelector({
  selectedMethod,
  onChange,
}: {
  selectedMethod: 'cod' | 'razorpay'
  onChange: (method: 'cod' | 'razorpay') => void
}) {
  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-md bg-neutral-50/50">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="radio"
            name="paymentMethod"
            value="razorpay"
            checked={selectedMethod === 'razorpay'}
            onChange={() => onChange('razorpay')}
            className="w-4 h-4 text-neutral-900 border-neutral-300 focus:ring-neutral-900"
          />
          <span className="font-medium text-sm">Pay Online (Razorpay Test Mode)</span>
        </label>
      </div>
      <div className="p-4 border rounded-md bg-neutral-50/50">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="radio"
            name="paymentMethod"
            value="cod"
            checked={selectedMethod === 'cod'}
            onChange={() => onChange('cod')}
            className="w-4 h-4 text-neutral-900 border-neutral-300 focus:ring-neutral-900"
          />
          <span className="font-medium text-sm">Cash on Delivery (COD)</span>
        </label>
      </div>
    </div>
  )
}
