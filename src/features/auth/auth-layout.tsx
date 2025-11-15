interface Props {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: Props) {
  return (
    <div className='bg-primary-foreground container grid h-svh max-w-none items-center justify-center'>
      <div className='mx-auto flex w-full flex-col justify-center space-y-2 py-8 sm:w-[480px] sm:p-8'>
        <div className='mb-4 flex items-center justify-center gap-2'>
          <img src="/images/logo.png" alt="Vinayak Naturals" className='size-10' />
          <h1 className='text-2xl font-bold text-primary/90'>Vinayak Naturals</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
