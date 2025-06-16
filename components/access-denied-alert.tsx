'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AccessDeniedAlertProps {
  searchParams: Promise<{ error?: string }>;
}

export function AccessDeniedAlert({ searchParams }: AccessDeniedAlertProps) {
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkError = async () => {
      const params = await searchParams;
      if (params.error === 'access_denied') {
        setError('access_denied');
        setIsVisible(true);
      }
    };
    
    checkError();
  }, [searchParams]);

  if (!isVisible || !error) {
    return null;
  }

  return (
    <div className="w-full px-4 py-2">
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-red-800">
            Admin paneline erişim izniniz yok. Lütfen yönetici ile iletişime geçin.
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="text-red-600 hover:text-red-800 p-1 h-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
} 