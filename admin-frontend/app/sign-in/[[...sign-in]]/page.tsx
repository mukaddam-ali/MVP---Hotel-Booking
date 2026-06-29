import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#0f2a47] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Pompano Beach Pointe</h1>
          <p className="text-white/50 text-sm mt-1">Admin Portal</p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
