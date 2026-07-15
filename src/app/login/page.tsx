import LoginForm from "@/components/auth/LoginForm";

function DoctorIllustration() {
  return (
    <svg viewBox="0 0 180 260" className="hidden h-64 w-auto lg:block" aria-hidden>
      <ellipse cx="90" cy="240" rx="55" ry="10" fill="#dbe7f5" />
      <circle cx="90" cy="58" r="28" fill="#f3d2b3" />
      <path d="M62 95h56c10 0 18 8 18 18v70H44v-70c0-10 8-18 18-18Z" fill="#ffffff" stroke="#c9d7e8" />
      <path d="M70 95v28c0 8 6 14 14 14h12c8 0 14-6 14-14V95" fill="#e8f1fb" />
      <path d="M55 120h-14c-6 0-10 5-9 11l8 40c1 5 6 9 11 9h8V120Z" fill="#2f80ed" />
      <path d="M125 120h14c6 0 10 5 9 11l-8 40c-1 5-6 9-11 9h-8V120Z" fill="#2f80ed" />
      <rect x="78" y="150" width="24" height="70" rx="4" fill="#3b4a63" />
      <rect x="108" y="135" width="28" height="36" rx="4" fill="#1f2937" />
      <rect x="112" y="140" width="20" height="14" rx="2" fill="#93c5fd" />
    </svg>
  );
}

function NurseIllustration() {
  return (
    <svg viewBox="0 0 180 260" className="hidden h-64 w-auto lg:block" aria-hidden>
      <ellipse cx="90" cy="240" rx="55" ry="10" fill="#dbe7f5" />
      <circle cx="90" cy="58" r="28" fill="#f3d2b3" />
      <path d="M60 98h60c12 0 20 10 18 21l-10 70H52l-10-70c-2-11 6-21 18-21Z" fill="#5b9cf5" />
      <path d="M78 98h24v18c0 7-5 12-12 12h0c-7 0-12-5-12-12V98Z" fill="#ffffff" />
      <circle cx="90" cy="128" r="8" fill="#ffffff" />
      <path d="M70 175c8 12 32 12 40 0" fill="none" stroke="#1e3a5f" strokeWidth="4" strokeLinecap="round" />
      <circle cx="68" cy="178" r="7" fill="none" stroke="#1e3a5f" strokeWidth="3" />
      <circle cx="112" cy="178" r="7" fill="none" stroke="#1e3a5f" strokeWidth="3" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex h-full min-h-screen items-center justify-center overflow-hidden bg-[#e8eef5] px-4">
      <div className="pointer-events-none absolute inset-x-8 inset-y-10 rounded-[2rem] bg-[#eef3f8]" />

      <div className="relative z-10 flex items-end gap-6 lg:gap-10">
        <DoctorIllustration />

        <div className="w-full max-w-[380px] rounded-2xl bg-white px-8 py-10 shadow-[0_12px_40px_rgba(47,128,237,0.12)] sm:px-10">
          <LoginForm />
        </div>

        <NurseIllustration />
      </div>
    </div>
  );
}
