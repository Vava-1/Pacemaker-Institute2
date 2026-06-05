import React from 'react';
import { useParams } from 'react-router';
import { trpc } from '@/providers/trpc';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Printer, Award } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function CertificateView() {
  const { certificateNumber } = useParams<{ certificateNumber: string }>();

  const { data: certificate, isLoading, error } = trpc.certificate.getCertificate.useQuery(
    { certificateNumber: certificateNumber || '' },
    { enabled: !!certificateNumber }
  );

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-5xl flex flex-col items-center gap-8">
        <div className="flex justify-between w-full max-w-[1000px] mb-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="w-full max-w-[1000px] aspect-[1.414/1] rounded-lg shadow-lg" />
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="container mx-auto py-20 px-4 max-w-xl">
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg">Certificate not found</AlertTitle>
          <AlertDescription className="text-sm mt-2">
            {error?.message || "The certificate you are looking for doesn't exist or is invalid. Please check the URL and try again."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-10 flex flex-col items-center">
      <style>
        {`
          @media print {
            @page {
              size: landscape;
              margin: 0;
            }
            body {
              background: white;
            }
            body * {
              visibility: hidden;
            }
            #certificate-container, #certificate-container * {
              visibility: visible;
            }
            #certificate-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100vw;
              height: 100vh;
              max-width: none !important;
              margin: 0;
              padding: 5% !important;
              box-shadow: none !important;
              background-color: white !important;
              border: none !important;
              display: flex;
              align-items: center;
              justify-content: center;
            }
          }
        `}
      </style>

      {/* Toolbar */}
      <div className="print:hidden w-full max-w-[1000px] mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-3">
          <Award className="h-8 w-8 text-amber-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800 leading-tight">Certificate of Completion</h1>
            <p className="text-sm text-slate-500">ID: {certificate.certificateNumber || certificateNumber}</p>
          </div>
        </div>
        <Button onClick={handlePrint} size="lg" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-md text-white">
          <Printer className="h-5 w-5" />
          Download / Print
        </Button>
      </div>

      {/* Certificate Wrapper */}
      <div className="w-full px-4 flex justify-center print:px-0">
        <div 
          id="certificate-container" 
          className="w-full max-w-[1000px] aspect-[1.414/1] bg-white shadow-2xl relative p-8 md:p-12 box-border flex items-center justify-center overflow-hidden border border-slate-200 print:shadow-none print:border-none"
        >
          {/* Background pattern / watermark (optional, kept simple for premium look) */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-50/30 via-white to-white pointer-events-none" />

          {/* Outer border */}
          <div className="absolute inset-4 md:inset-6 border-8 border-double border-slate-300 pointer-events-none" />
          
          {/* Inner border */}
          <div className="absolute inset-8 md:inset-10 border border-slate-200 pointer-events-none" />

          {/* Content */}
          <div className="relative w-full h-full flex flex-col items-center justify-between text-center py-6 md:py-12 z-10">
            {/* Header */}
            <div className="space-y-4 md:space-y-6 mt-4 md:mt-8">
              <h1 className="text-3xl md:text-5xl font-serif text-slate-900 uppercase tracking-[0.15em]">
                Pacemaker Institute
              </h1>
              <h2 className="text-lg md:text-2xl text-amber-700 font-light tracking-[0.2em] uppercase">
                Certificate of Completion
              </h2>
            </div>

            <div className="space-y-6 md:space-y-8 my-6 md:my-8 flex-1 flex flex-col justify-center">
              <p className="text-slate-500 italic text-base md:text-xl font-serif">This is to certify that</p>
              <p className="text-3xl md:text-5xl font-serif text-slate-800 border-b-2 border-slate-300 pb-2 px-8 md:px-16 inline-block mx-auto max-w-[80%] whitespace-nowrap overflow-hidden text-ellipsis">
                {certificate.studentName || 'Student Name'}
              </p>
              <p className="text-slate-500 italic text-base md:text-xl font-serif">has successfully completed the course</p>
              <p className="text-xl md:text-3xl font-medium text-slate-800 max-w-2xl mx-auto px-4">
                {certificate.courseName || 'Course Name'}
              </p>
            </div>

            {/* Footer Grid */}
            <div className="w-full grid grid-cols-3 gap-4 md:gap-8 items-end px-4 md:px-12 mb-4 md:mb-8">
              {/* Issue Date */}
              <div className="flex flex-col items-center">
                <div className="h-10 md:h-12 border-b-2 border-slate-400 w-full mb-2 flex items-end justify-center pb-1 px-2">
                  <span className="text-slate-700 font-serif text-sm md:text-lg">
                    {certificate.issueDate 
                      ? new Date(certificate.issueDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : new Date().toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                  </span>
                </div>
                <span className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest">Issue Date</span>
              </div>

              {/* Seal */}
              <div className="flex flex-col items-center justify-end h-full">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-2 border-amber-500 bg-amber-50 flex flex-col items-center justify-center mb-2 md:mb-4 shadow-sm relative">
                  <div className="absolute inset-1 border border-dashed border-amber-400 rounded-full" />
                  <span className="text-amber-700 font-serif text-[10px] md:text-xs text-center px-2 leading-tight">
                    Official<br/>Seal
                  </span>
                </div>
              </div>

              {/* Instructor */}
              <div className="flex flex-col items-center">
                <div className="h-10 md:h-12 border-b-2 border-slate-400 w-full mb-2 flex items-end justify-center pb-1 px-2">
                  <span className="text-slate-800 font-serif italic text-base md:text-2xl whitespace-nowrap">
                    {certificate.instructorName || 'Instructor Name'}
                  </span>
                </div>
                <span className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest">Instructor</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
