import { Doc, Id } from "../convex/_generated/dataModel";

type Event = Doc<"events">;
type UserProfile = Doc<"user_profiles">;

export type ModerationStatus = 
  | "not_submitted" 
  | "pending_review" 
  | "approved" 
  | "rejected" 
  | "requires_changes";

export type RiskFactor = 
  | "new_organizer"
  | "high_ticket_price" 
  | "vague_description"
  | "suspicious_images"
  | "duplicate_content"
  | "misleading_title"
  | "no_refund_policy"
  | "unrealistic_claims";

export interface FraudAnalysisResult {
  score: number; // 0-100 risk score
  riskFactors: RiskFactor[];
  requiresManualReview: boolean;
  recommendation: "auto_approve" | "manual_review" | "auto_reject";
}

/**
 * Analyze event for potential fraud and calculate risk score
 */
export function analyzeEventForFraud(event: Event, organizer: UserProfile): FraudAnalysisResult {
  const riskFactors: RiskFactor[] = [];
  let riskScore = 0;

  // 1. New Organizer Risk (25 points)
  if (!organizer.organizer_since || Date.now() - organizer.organizer_since < 30 * 24 * 60 * 60 * 1000) {
    riskFactors.push("new_organizer");
    riskScore += 25;
  }

  // 2. Description Quality (20 points)
  if (event.description.length < 100 || 
      event.description.toLowerCase().includes("guaranteed") ||
      event.description.toLowerCase().includes("100% profit")) {
    riskFactors.push("vague_description");
    riskScore += 20;
  }

  // 3. Unrealistic Claims (30 points)
  const suspiciousTerms = ["get rich quick", "guaranteed profit", "no risk", "instant millionaire"];
  if (suspiciousTerms.some(term => 
    event.title.toLowerCase().includes(term) || 
    event.description.toLowerCase().includes(term)
  )) {
    riskFactors.push("unrealistic_claims");
    riskScore += 30;
  }

  // 4. Missing Refund Policy (15 points)
  if (!event.refund_policy || event.refund_policy.length < 50) {
    riskFactors.push("no_refund_policy");
    riskScore += 15;
  }

  // 5. Misleading Title (20 points)
  const misleadingTerms = ["free", "secret", "exclusive", "limited time"];
  if (misleadingTerms.some(term => event.title.toLowerCase().includes(term))) {
    riskFactors.push("misleading_title");
    riskScore += 20;
  }

  // Determine recommendation
  let recommendation: "auto_approve" | "manual_review" | "auto_reject";
  let requiresManualReview = false;

  if (riskScore <= 20) {
    recommendation = "auto_approve";
  } else if (riskScore <= 60) {
    recommendation = "manual_review";
    requiresManualReview = true;
  } else {
    recommendation = "auto_reject";
    requiresManualReview = true;
  }

  return {
    score: Math.min(riskScore, 100),
    riskFactors,
    requiresManualReview,
    recommendation
  };
}

/**
 * Get moderation status display info
 */
export function getModerationStatusInfo(status: ModerationStatus): {
  label: string;
  color: string;
  description: string;
  icon: string;
} {
  const statusMap = {
    "not_submitted": {
      label: "Draft",
      color: "bg-gray-500",
      description: "Event is still being edited",
      icon: "📝"
    },
    "pending_review": {
      label: "Pending Review",
      color: "bg-yellow-500", 
      description: "Waiting for admin approval",
      icon: "⏳"
    },
    "approved": {
      label: "Approved",
      color: "bg-green-500",
      description: "Admin approved, ready to publish",
      icon: "✅"
    },
    "rejected": {
      label: "Rejected",
      color: "bg-red-500",
      description: "Admin rejected this event",
      icon: "❌"
    },
    "requires_changes": {
      label: "Needs Changes",
      color: "bg-orange-500",
      description: "Admin requested modifications",
      icon: "🔄"
    }
  };

  return statusMap[status];
}

/**
 * Check if event can be published
 */
export function canPublishEvent(event: Event): boolean {
  return event.moderation_status === "approved" && event.status !== "rejected";
}

/**
 * Check if event needs admin review
 */
export function needsAdminReview(event: Event): boolean {
  return event.moderation_status === "pending_review" || 
         event.requires_manual_review === true;
}

/**
 * Get risk factor display info
 */
export function getRiskFactorInfo(factor: RiskFactor): {
  label: string;
  description: string;
  severity: "low" | "medium" | "high";
} {
  const factorMap: Record<RiskFactor, { label: string; description: string; severity: "low" | "medium" | "high" }> = {
    "new_organizer": {
      label: "New Organizer",
      description: "Organizer account created recently",
      severity: "medium"
    },
    "high_ticket_price": {
      label: "High Ticket Price", 
      description: "Ticket prices are unusually high",
      severity: "medium"
    },
    "vague_description": {
      label: "Vague Description",
      description: "Event description lacks detail or clarity",
      severity: "medium"
    },
    "suspicious_images": {
      label: "Suspicious Images",
      description: "Images appear fake or inappropriate",
      severity: "high"
    },
    "duplicate_content": {
      label: "Duplicate Content",
      description: "Content appears copied from other events",
      severity: "high"
    },
    "misleading_title": {
      label: "Misleading Title",
      description: "Title contains potentially misleading terms",
      severity: "medium"
    },
    "no_refund_policy": {
      label: "No Refund Policy",
      description: "Missing or inadequate refund policy",
      severity: "low"
    },
    "unrealistic_claims": {
      label: "Unrealistic Claims",
      description: "Event makes unrealistic promises or guarantees",
      severity: "high"
    }
  };

  return factorMap[factor];
}

/**
 * Prepare event for submission to admin review
 */
export function prepareEventForReview(event: Event, organizer: UserProfile): Partial<Event> {
  const fraudAnalysis = analyzeEventForFraud(event, organizer);
  
  return {
    status: "pending",
    moderation_status: "pending_review",
    submitted_for_review_at: Date.now(),
    fraud_score: fraudAnalysis.score,
    risk_factors: fraudAnalysis.riskFactors,
    requires_manual_review: fraudAnalysis.requiresManualReview,
    updated_at: Date.now()
  };
}

/**
 * Admin approve event
 */
export function approveEvent(event: Event, adminId: string, notes?: string): Partial<Event> {
  return {
    status: "approved",
    moderation_status: "approved", 
    reviewed_at: Date.now(),
    reviewed_by: adminId as Id<"users">,
    admin_notes: notes,
    updated_at: Date.now()
  };
}

/**
 * Admin reject event
 */
export function rejectEvent(event: Event, adminId: string, reason: string, notes?: string): Partial<Event> {
  return {
    status: "rejected",
    moderation_status: "rejected",
    reviewed_at: Date.now(),
    reviewed_by: adminId as Id<"users">,
    rejection_reason: reason,
    admin_notes: notes,
    updated_at: Date.now()
  };
}

/**
 * Request changes to event
 */
export function requestEventChanges(event: Event, adminId: string, reason: string, notes?: string): Partial<Event> {
  return {
    status: "draft", // Back to draft for editing
    moderation_status: "requires_changes",
    reviewed_at: Date.now(),
    reviewed_by: adminId as Id<"users">,
    rejection_reason: reason,
    admin_notes: notes,
    updated_at: Date.now()
  };
}

/**
 * Get events pending admin review (for admin dashboard)
 */
export function getReviewPriority(event: Event): "high" | "medium" | "low" {
  const fraudScore = event.fraud_score || 0;
  
  if (fraudScore >= 60) return "high";
  if (fraudScore >= 30) return "medium";
  return "low";
}

/**
 * Check if organizer can edit event
 */
export function canEditEvent(event: Event): boolean {
  return event.moderation_status === "not_submitted" || 
         event.moderation_status === "requires_changes";
}

/**
 * Check if organizer can submit event for review
 */
export function canSubmitForReview(event: Event): boolean {
  return event.moderation_status === "not_submitted" || 
         event.moderation_status === "requires_changes";
}

/**
 * Get moderation workflow steps
 */
export function getModerationWorkflow(): Array<{
  step: number;
  status: ModerationStatus;
  title: string;
  description: string;
}> {
  return [
    {
      step: 1,
      status: "not_submitted",
      title: "Create Event",
      description: "Organizer creates and edits event details"
    },
    {
      step: 2, 
      status: "pending_review",
      title: "Submit for Review",
      description: "Event submitted to admin for approval"
    },
    {
      step: 3,
      status: "approved",
      title: "Admin Approval",
      description: "Admin reviews and approves the event"
    },
    {
      step: 4,
      status: "approved",
      title: "Publish Event", 
      description: "Event goes live and tickets can be sold"
    }
  ];
}

/**
 * Format fraud score for display
 */
export function formatFraudScore(score: number): {
  level: "low" | "medium" | "high";
  color: string;
  description: string;
} {
  if (score <= 30) {
    return {
      level: "low",
      color: "bg-green-500",
      description: "Low risk event"
    };
  } else if (score <= 60) {
    return {
      level: "medium", 
      color: "bg-yellow-500",
      description: "Medium risk - requires review"
    };
  } else {
    return {
      level: "high",
      color: "bg-red-500", 
      description: "High risk event"
    };
  }
} 