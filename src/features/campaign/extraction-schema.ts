import { z } from 'zod';

const MAX_FILES = 4;
const nullableText = z.string().max(2000).nullable().optional();

export const productDraftSchema = z.object({
  name: z.string().max(200).nullable().optional(),
  brand: z.string().max(120).nullable().optional(),
  model: z.string().max(160).nullable().optional(),
  category: z.string().max(120).nullable().optional(),
  price: z.union([z.string().max(100), z.number().finite()]).nullable().optional(),
  mrp: z.union([z.string().max(100), z.number().finite()]).nullable().optional(),
  offer: z.string().max(500).nullable().optional(),
  source_file_index: z.number().int().min(1).max(MAX_FILES).nullable().optional(),
  source_page: z.union([z.number().int().positive(), z.string().max(20)]).nullable().optional(),
  source_text: nullableText,
  confidence: z.number().finite().min(0).max(1).nullable().optional(),
  uncertainties: z.array(z.string().max(250)).max(20).optional(),
}).strict();

export const extractionResponseSchema = z.object({ products: z.array(productDraftSchema).max(250) }).strict();
export type ValidatedExtraction = z.infer<typeof extractionResponseSchema>;
