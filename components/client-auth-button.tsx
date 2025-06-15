'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { User } from '@supabase/supabase-js';

export function ClientAuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div className="w-20 h-8 bg-muted animate-pulse rounded"></div>;
  }

  return user ? (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground hidden sm:inline">
        {user.email}
      </span>
      <Button
        variant="outline"
        onClick={handleSignOut}
        className="w-full"
      >
        Sign out
      </Button>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"} className="text-xs">
        <Link href="/auth/login">Giriş</Link>
      </Button>
      <Button asChild size="sm" variant={"default"} className="text-xs">
        <Link href="/auth/sign-up">Kayıt</Link>
      </Button>
    </div>
  );
} 