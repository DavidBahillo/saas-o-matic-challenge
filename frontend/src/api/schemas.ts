// Esquemas Zod de las respuestas de éxito (RF34). `satisfies` los ata a los tipos de shared/ (D-P6).
import { PLANS, TAX_ID_TYPES } from '@saas-o-matic/shared';
import type { Currency, Customer, CustomerList, Simulation } from '@saas-o-matic/shared';
import { z } from 'zod';

const int = z.number().int();
const cents = z.number().int();

/** Divisa leída: solo el formato, no la lista, para que una divisa ya retirada no rompa la lectura (PT6, RF17). */
const currencyCode = z
  .string()
  .regex(/^[A-Z]{3}$/)
  .transform((code) => code as Currency);

export const customerSchema = z.object({
  id: int,
  companyName: z.string(),
  taxId: z.string(),
  taxIdType: z.enum(TAX_ID_TYPES),
  email: z.string(),
  country: z.string(),
  plan: z.enum(PLANS),
  createdAt: z.string(),
  simulationCount: int.nonnegative(),
}) satisfies z.ZodType<Customer>;

export const customerListSchema = z.object({
  items: z.array(customerSchema),
  total: int.nonnegative(),
}) satisfies z.ZodType<CustomerList>;

const tierLineSchema = z.object({
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  from: int,
  to: int.nullable(),
  unitPriceCents: cents,
  billedUsers: int,
  subtotalCents: cents,
});

export const simulationSchema = z.object({
  id: int,
  customerId: int,
  users: int,
  storage: int,
  apiCalls: int,
  tiers: z.array(tierLineSchema),
  baseCents: cents,
  country: z.string(),
  vatRatePercent: z.number(),
  vatCents: cents,
  totalCents: cents,
  currency: currencyCode,
  exchangeRate: z.string(),
  exchangeRateAt: z.string(),
  convertedBaseCents: cents,
  convertedVatCents: cents,
  convertedTotalCents: cents,
  createdAt: z.string(),
}) satisfies z.ZodType<Simulation>;

/** GET /customers/:id/simulations devuelve { items } (controlador de la 003, plan R2). */
export const simulationListSchema = z.object({ items: z.array(simulationSchema) });

export const exchangeRateSchema = z.object({
  currency: z.string().regex(/^[A-Z]{3}$/),
  exchangeRate: z.string(),
  exchangeRateAt: z.string(),
});
export type ExchangeRate = z.infer<typeof exchangeRateSchema>;

export const exchangeRateListSchema = z.object({ items: z.array(exchangeRateSchema) });
