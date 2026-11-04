'use client';

import React from 'react';
import { ShieldCheck, HardDrive, Info } from 'lucide-react';

interface StorageNoticeProps {
  totalRuns: number;
}

export const StorageNotice: React.FC<StorageNoticeProps> = ({ totalRuns }) => {
  return (
    <div
      className="rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-2xs"
      role="region"
      aria-label="Browser Storage and Privacy Notice"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <span className="font-semibold text-slate-800">Privacy &amp; Browser-Only Storage: </span>
            <span>
              All test reports are parsed entirely in memory on the backend and never saved. Your run history
              is stored exclusively in this browser&apos;s <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">localStorage</code>.
              Data is not synced across devices, shared with third parties, or saved to a server database.
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-slate-500 shrink-0 self-end sm:self-center">
          <HardDrive className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="font-medium">
            {totalRuns} {totalRuns === 1 ? 'run' : 'runs'} saved locally
          </span>
        </div>
      </div>
    </div>
  );
};
