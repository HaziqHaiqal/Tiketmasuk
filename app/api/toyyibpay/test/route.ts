import { NextRequest, NextResponse } from "next/server";
import { getToyyibPayConfig } from "@/lib/toyyibpay/config";

export async function GET(req: NextRequest) {
  try {
    // Test configuration loading
    const config = getToyyibPayConfig();
    
    return NextResponse.json({
      success: true,
      message: "ToyyibPay configuration is valid",
      sandbox: config.sandbox,
      hasSecretKey: !!config.secretKey,
      hasCategoryCode: !!config.categoryCode,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 400 });
  }
} 