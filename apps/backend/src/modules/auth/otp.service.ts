// apps/backend/src/modules/auth/otp.service.ts
import { db } from "../../db";
import { otpVerification } from "../../db/schema/auth";
import { eq, and, gt } from "drizzle-orm";

// Generate 6-digit OTP
export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create OTP record
export const createOtp = async (
  phoneNumber: string,
  purpose: 'signup' | 'signin' | 'phone_verification' | 'password_reset'
) => {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Delete any existing unverified OTPs for this phone number and purpose
  await db
    .delete(otpVerification)
    .where(
      and(
        eq(otpVerification.phoneNumber, phoneNumber),
        eq(otpVerification.purpose, purpose),
        eq(otpVerification.verified, false)
      )
    );

  // Create new OTP
  const [otpRecord] = await db
    .insert(otpVerification)
    .values({
      phoneNumber,
      otp,
      expiresAt,
      purpose,
      attempts: 0,
      verified: false,
    })
    .returning();

  return { otp, otpRecord };
};

// Verify OTP
export const verifyOtp = async (
  phoneNumber: string,
  otp: string,
  purpose: 'signup' | 'signin' | 'phone_verification' | 'password_reset'
): Promise<{ valid: boolean; message: string }> => {
  const [otpRecord] = await db
    .select()
    .from(otpVerification)
    .where(
      and(
        eq(otpVerification.phoneNumber, phoneNumber),
        eq(otpVerification.purpose, purpose),
        eq(otpVerification.verified, false)
      )
    )
    .orderBy(otpVerification.createdAt)
    .limit(1);

  if (!otpRecord) {
    return { valid: false, message: "No OTP request found" };
  }

  // Check if OTP expired
  if (new Date() > otpRecord.expiresAt) {
    return { valid: false, message: "OTP has expired" };
  }

  // Check max attempts (5 attempts)
  if (otpRecord.attempts >= 5) {
    return { valid: false, message: "Maximum attempts exceeded" };
  }

  // Increment attempts
  await db
    .update(otpVerification)
    .set({ attempts: otpRecord.attempts + 1 })
    .where(eq(otpVerification.id, otpRecord.id));

  // Verify OTP
  if (otpRecord.otp !== otp) {
    return { valid: false, message: "Invalid OTP" };
  }

  // Mark as verified
  await db
    .update(otpVerification)
    .set({ verified: true })
    .where(eq(otpVerification.id, otpRecord.id));

  return { valid: true, message: "OTP verified successfully" };
};

// Send OTP via SMS using Beem Africa
export const sendOtp = async (phoneNumber: string, otp: string) => {
  // Format phone number for Beem (remove + and ensure starts with 255)
  let formattedPhone = phoneNumber.replace(/\s+/g, '');
  if (formattedPhone.startsWith('+')) {
    formattedPhone = formattedPhone.substring(1);
  }
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '255' + formattedPhone.substring(1);
  }

  const beemApiKey = process.env.BEEM_API_KEY;
  const beemSecretKey = process.env.BEEM_SECRET_KEY;
  const beemSourceAddr = process.env.BEEM_SOURCE_ADDR || 'INFO';

  // Always log OTP in console for testing (can be disabled in production)
  console.log(`[OTP] Sending to ${phoneNumber}: ${otp}`);

  // If credentials not configured, log warning but continue (dev mode)
  if (!beemApiKey || !beemSecretKey) {
    console.warn('⚠️ Beem Africa credentials not configured - OTP only logged to console');
    return { 
      success: true, 
      otp, 
      devMode: true,
      message: 'OTP logged to console (Beem credentials not configured)' 
    };
  }

  try {
    // Beem Africa API endpoint
    const beemUrl = 'https://apisms.beem.africa/v1/send';

    const message = `Your verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;

    // Beem Africa official payload format
    const payload = {
      source_addr: beemSourceAddr,
      encoding: 0,
      schedule_time: '',
      message,
      recipients: [
        {
          recipient_id: '1',
          dest_addr: formattedPhone,
        },
      ],
    };

    console.log('📤 Sending SMS via Beem Africa...');

    const response = await fetch(beemUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${beemApiKey}:${beemSecretKey}`).toString('base64')}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    // Log full response for debugging
    console.log('📥 Beem Africa Response:', JSON.stringify(result, null, 2));

    if (!response.ok || !result.successful) {
      console.error('❌ Beem Africa SMS error:', result);
      throw new Error(result.message || 'Failed to send SMS');
    }

    console.log(`✅ OTP sent successfully to ${phoneNumber}`);
    console.log(`   Request ID: ${result.request_id}`);
    console.log(`   Valid: ${result.valid}, Invalid: ${result.invalid}`);
    
    return { 
      success: true, 
      messageId: result.request_id,
      code: result.code,
      message: result.message,
      valid: result.valid,
      invalid: result.invalid,
      otp, // Always include for testing
    };
  } catch (error: any) {
    console.error('❌ Error sending OTP via Beem:', error);
    
    // Fallback to console log on error
    console.log(`[FALLBACK] OTP for ${phoneNumber}: ${otp}`);
    
    return { 
      success: false, 
      otp, 
      error: error.message,
      fallback: true,
      message: 'SMS sending failed - OTP logged to console' 
    };
  }
};