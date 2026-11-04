'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Loader2, AlertCircle, X, Sparkles } from 'lucide-react';
import { uploadJUnitReport } from '../lib/api';
import { NormalizedTestRun } from '../lib/types';

interface UploadSectionProps {
  onRunUploaded: (run: NormalizedTestRun) => void;
  onLoadSampleData: () => void;
  apiStatus: 'checking' | 'online' | 'offline';
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onRunUploaded,
  onLoadSampleData,
  apiStatus,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const normalizedRun = await uploadJUnitReport(file);
      onRunUploaded(normalizedRun);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Failed to analyze the JUnit report. Please check the file and try again.'
      );
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Upload Test Report</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select or drop a single JUnit XML report (<code className="text-slate-700">.xml</code>, max 2 MB).
            Processed in memory.
          </p>
        </div>

        {/* Quick action: Explore with Sample Reports */}
        <button
          onClick={onLoadSampleData}
          disabled={isLoading}
          className="inline-flex items-center justify-center space-x-2 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 shrink-0"
        >
          <Sparkles className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <span>Load 6 Demo Runs</span>
        </button>
      </div>

      {/* Drag & Drop Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
        } ${isLoading ? 'pointer-events-none opacity-80' : ''}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-label="Upload JUnit XML test report"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xml,.junit,.txt"
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-2.5 py-3">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" aria-hidden="true" />
            <span className="text-sm font-semibold text-slate-800">Processing test report...</span>
            <span className="text-xs text-slate-500 max-w-sm">
              If the backend is waking from free-tier sleep, this may take up to 25 seconds.
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2 py-2">
            <div className="h-10 w-10 rounded-full bg-blue-100/60 text-blue-600 flex items-center justify-center">
              <UploadCloud className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-sm font-semibold text-blue-600 hover:underline">
                Click to browse
              </span>{' '}
              <span className="text-sm text-slate-600">or drop a JUnit XML file here</span>
            </div>
            <p className="text-xs text-slate-400">
              Compatible with Maven, Gradle, Pytest, Jest, Go, and JUnit XML outputs
            </p>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div
          className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between text-xs"
          role="alert"
        >
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-rose-900">Upload or Parsing Error</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 ml-2"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
