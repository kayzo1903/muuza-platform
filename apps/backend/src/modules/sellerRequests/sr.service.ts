// apps/backend/src/modules/sellerRequests/sr.service.ts
import { CreateSellerRequestInput } from './sr.validation';
import { db } from "../../db/index";
import { sellerRequests, sellerRequestDocuments } from "../../db/schema/sellers";
import { eq } from "drizzle-orm";

// Helper functions to infer file types
const inferFileType = (fileKey: string): string => {
  const extension = fileKey.split('.').pop()?.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
    return 'image';
  }
  if (extension === 'pdf') {
    return 'pdf';
  }
  return 'other';
};

const inferDocumentType = (fileKey: string): string => {
  const lowerKey = fileKey.toLowerCase();
  
  if (lowerKey.includes('license') || lowerKey.includes('business-license')) {
    return 'business_license';
  }
  if (lowerKey.includes('tin') || lowerKey.includes('tax')) {
    return 'tin_certificate';
  }
  if (lowerKey.includes('id') || lowerKey.includes('identification')) {
    return 'identification';
  }
  return 'other';
};

export const createRequest = async (userId: string, data: CreateSellerRequestInput) => {
  return await db.transaction(async (tx) => {
    // 1. Create the main seller request record
    const [request] = await tx.insert(sellerRequests).values({
      submittedBy: userId,
      businessName: data.businessName,
      businessTypes: data.businessTypes,
      tinNumber: data.tinNumber,
      region: data.region,
      district: data.district,
      street: data.street,
      landmark: data.landmark || null,
      facebook: data.facebook || null,
      instagram: data.instagram || null,
      tiktok: data.tiktok || null,
      whatsapp: data.whatsapp || null,
      description: data.description,
      documentKeys: data.documentKeys,
      agreedToTerms: data.agree,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // 2. Create document records for each uploaded file
    if (data.documentKeys.length > 0) {
      const documentRecords = data.documentKeys.map((fileKey) => {
        const fileType = inferFileType(fileKey);
        const documentType = inferDocumentType(fileKey);
        
        return {
          requestId: request.id,
          fileKey,
          fileType,
          metadata: JSON.stringify({
            originalName: fileKey.split('/').pop(),
            uploadedBy: userId,
            documentType,
            size: 0,
          }),
          uploadedAt: new Date(),
        };
      });

      await tx.insert(sellerRequestDocuments).values(documentRecords);
    }

    return request;
  });
};

export const getRequestsByUser = async (userId: string) => {
  return await db
    .select()
    .from(sellerRequests)
    .where(eq(sellerRequests.submittedBy, userId));
};