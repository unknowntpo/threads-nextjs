import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET() {
  const startTime = Date.now();
  
  try {
    logger.apiRequest('GET', '/api/debug/supabase');
    logger.info('Starting Supabase debug check');
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Log environment status
    logger.debug('Supabase URL configured:', !!supabaseUrl);
    logger.debug('Anon key configured:', !!supabaseAnonKey, supabaseAnonKey ? `(${supabaseAnonKey.substring(0, 20)}...)` : 'MISSING');
    logger.debug('Service key configured:', !!supabaseServiceKey, supabaseServiceKey ? `(${supabaseServiceKey.substring(0, 20)}...)` : 'MISSING');
    logger.debug('Environment:', process.env.NODE_ENV);
    
    // Safe info for client response (no sensitive data)
    const clientSafeInfo = {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasServiceKey: !!supabaseServiceKey,
      nodeEnv: process.env.NODE_ENV
    };
    
    if (!supabaseUrl || !supabaseAnonKey) {
      logger.error('Missing required environment variables');
      logger.apiError('GET', '/api/debug/supabase', 'Missing environment variables');
      return NextResponse.json({
        error: 'Missing required Supabase environment variables',
        environment: clientSafeInfo
      }, { status: 500 });
    }

    // Test basic connection
    const supabase = await createClient();
    
    // Try to fetch from profiles table (this will test RLS and connection)
    logger.info('Testing database connection...');
    const { error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      logger.error('Supabase query failed:', { message: error.message, code: error.code });
      logger.apiError('GET', '/api/debug/supabase', error);
      return NextResponse.json({
        error: 'Supabase connection test failed',
        details: error.message,
        code: error.code,
        environment: clientSafeInfo
      }, { status: 400 });
    }

    logger.success('Database connection successful!');
    logger.info('Profile count:', count);
    
    const duration = Date.now() - startTime;
    logger.apiSuccess('GET', '/api/debug/supabase', duration);

    return NextResponse.json({
      status: 'Supabase connection successful',
      profilesTableExists: true,
      profileCount: count,
      environment: clientSafeInfo
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}