import { z } from "zod"

export const ProjectBriefSchema = z.object({
  industry: z.string().min(1).max(100),
  keywords: z.array(z.string().min(1).max(50)).min(1).max(20),
  targetAudience: z.string().min(1).max(200),
  tone: z.string().min(1).max(100),
  languages: z.array(z.string().min(2).max(10)).min(1).max(10),
  avoidWords: z.array(z.string()).optional(),
})

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  brief: ProjectBriefSchema,
  disclaimer_accepted: z.literal(true, {
    errorMap: () => ({
      message: "You must accept the disclaimer to create a project.",
    }),
  }),
})

export const GenerateNamesSchema = z.object({
  count: z.number().int().min(10).max(200).default(80),
})

export const DomainCheckSchema = z.object({
  names: z.array(z.string().min(1)).min(1).max(50),
  tlds: z.array(z.enum([".com", ".net", ".org", ".io", ".co", ".ai", ".fr", ".eu"])).min(1).max(8),
})
