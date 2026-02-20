'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AnalyticsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/bots');
  }, [router]);
  return null;
}
