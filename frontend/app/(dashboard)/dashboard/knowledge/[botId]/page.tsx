'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/** Redirect old per-bot knowledge URL to main Knowledge Base page. */
export default function KnowledgeBotRedirect() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    router.replace('/dashboard/knowledge');
  }, [router, params.botId]);

  return null;
}
