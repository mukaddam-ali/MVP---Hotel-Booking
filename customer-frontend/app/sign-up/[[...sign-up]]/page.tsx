import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#faf8f4] flex items-center justify-center px-4 py-12">
      <SignUp />
    </div>
  );
}
