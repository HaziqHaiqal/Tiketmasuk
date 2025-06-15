import { NextResponse } from "next/server";
import { getToyyibPayConfig } from "@/lib/toyyibpay/config";

export async function GET() {
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
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 400 });
  }
} 