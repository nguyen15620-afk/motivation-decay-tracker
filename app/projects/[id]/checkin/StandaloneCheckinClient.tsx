'use client';

/**
 * Component: StandaloneCheckinClient.tsx
 * Description: Client wrapper handling quick router redirect after checkin submit.
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { CheckinForm } from '@/components/checkin/CheckinForm';

interface StandaloneCheckinClientProps {
  projectId: string;
  projectName: string;
}

export function StandaloneCheckinClient({
  projectId,
  projectName,
}: StandaloneCheckinClientProps) {
  const router = useRouter();

  const handleSuccess = () => {
    setTimeout(() => {
      router.push(`/projects/${projectId}`);
    }, 1200);
  };

  return (
    <CheckinForm
      projectId={projectId}
      projectName={projectName}
      onCheckinSuccess={handleSuccess}
    />
  );
}
