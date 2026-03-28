import { z } from 'zod';

export const ExtractionSchema = z.object({
  summary: z.string(),
  category: z.enum(['Food', 'Events', 'Sports', 'Ideas', 'Medical']),
  location: z.object({
    city: z.string().nullable(),
    specific_name: z.string().nullable(),
  }),
  action_items: z.array(z.object({ task: z.string(), owner: z.string() })),
  source_context: z.string(),
});

export type ExtractionResult = z.infer<typeof ExtractionSchema>;

export function parseExtraction(raw: unknown): ExtractionResult | null {
  const result = ExtractionSchema.safeParse(raw);
  if (!result.success) {
    console.error('Extraction schema validation failed:', result.error.issues);
    return null;
  }
  return result.data;
}
