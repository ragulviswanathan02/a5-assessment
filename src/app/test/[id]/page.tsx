'use client';

import React, { use, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

function DirectTestContent({ params }: Props) {
  const router = useRouter();
  const resolvedParams = use(params);

  useEffect(() => {
    if (resolvedParams.id) {
      router.replace(`/?id=${resolvedParams.id}`);
    }
  }, [resolvedParams.id, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
      <p className="text-slate-600 font-medium text-sm">Launching student assessment...</p>
    </div>
  );
}

export default function DirectTestPage(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
          <p className="text-slate-600 font-medium text-sm">Loading test...</p>
        </div>
      }
    >
      <DirectTestContent {...props} />
    </Suspense>
  );
}
