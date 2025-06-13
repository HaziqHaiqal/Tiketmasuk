import { NextRequest, NextResponse } from 'next/server';
import { ToyyibPaySetup, getSetupInstructions, quickSetup } from '@/lib/toyyibpay/setup';

export async function GET() {
  try {
    const configStatus = ToyyibPaySetup.getConfigStatus();
    
    if (!configStatus.isConfigured) {
      return NextResponse.json({
        configured: false,
        message: 'ToyyibPay is not properly configured',
        instructions: getSetupInstructions(),
        status: configStatus,
      });
    }

    return NextResponse.json({
      configured: true,
      message: 'ToyyibPay is properly configured',
      status: configStatus,
    });
  } catch (error) {
    return NextResponse.json({
      configured: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      instructions: getSetupInstructions(),
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { categoryName } = await request.json();
    
    if (!categoryName || typeof categoryName !== 'string') {
      return NextResponse.json({
        error: 'Category name is required and must be a string',
      }, { status: 400 });
    }

    const categoryCode = await quickSetup(categoryName);
    
    return NextResponse.json({
      success: true,
      categoryCode,
      message: `Category "${categoryName}" created successfully. Add TOYYIBPAY_CATEGORY_CODE=${categoryCode} to your .env.local file.`,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      instructions: getSetupInstructions(),
    }, { status: 500 });
  }
} 