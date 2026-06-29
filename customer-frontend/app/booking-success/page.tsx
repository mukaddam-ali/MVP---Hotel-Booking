import Link from 'next/link';
import { CheckCircle2, CalendarDays, Home } from 'lucide-react';

export default function BookingSuccessPage() {
  return (
    <div className="min-h-screen bg-[#faf8f4] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-3xl shadow-lg p-10">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>

          <h1 className="text-2xl font-bold text-[#0f2a47] mb-3">Booking Confirmed!</h1>
          <p className="text-gray-500 leading-relaxed mb-8">
            Your reservation at Pompano Beach Pointe is confirmed. You'll receive a confirmation email shortly with all the details.
          </p>

          <div className="bg-[#faf8f4] rounded-2xl p-5 mb-8 text-left space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              Payment processed securely via Stripe
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              Dates are now blocked on the calendar
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              Confirmation email on its way
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/my-bookings"
              className="flex-1 flex items-center justify-center gap-2 bg-[#0f2a47] hover:bg-[#1a3a5c] text-white font-bold py-3 rounded-xl transition-colors"
            >
              <CalendarDays className="w-4 h-4" /> View My Bookings
            </Link>
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
            >
              <Home className="w-4 h-4" /> Home
            </Link>
          </div>
        </div>

        <p className="text-gray-400 text-xs mt-6">
          Questions? Email us at <a href="mailto:hello@pbpointe.com" className="underline">hello@pbpointe.com</a>
        </p>
      </div>
    </div>
  );
}
