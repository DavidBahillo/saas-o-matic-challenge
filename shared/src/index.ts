// API pública de @saas-o-matic/shared.
export const SHARED_PACKAGE_NAME = '@saas-o-matic/shared';

export { TAX_ID_TYPES } from './customers/types';
export type {
  ApiErrorBody,
  ApiErrorCode,
  Customer,
  CustomerList,
  DeleteCustomerResult,
  FieldError,
  FieldErrorCode,
  FieldErrorReason,
  NewCustomer,
  ResourceReason,
  TaxIdReason,
  TaxIdType,
  UsersReason,
} from './customers/types';
export { PLANS, isPlan } from './customers/plans';
export type { Plan } from './customers/plans';
export { fail, ok, readText } from './customers/field-result';
export type { FieldErrorExtras, FieldResult, TextFieldMessages } from './customers/field-result';
export { ISO_3166_ALPHA2, isIsoAlpha2 } from './countries/iso3166-alpha2';
export { COUNTRY_CURRENCY, COUNTRY_CURRENCY_GROUPS, currencyForCountry } from './countries/country-currency';
export type { CountryCurrencyResult } from './countries/country-currency';
export { COUNTRY_MESSAGES, checkCountryCode, validateCountry } from './countries/validate-country';
export {
  COMPANY_NAME_MAX_LENGTH,
  COMPANY_NAME_MESSAGES,
  COMPANY_NAME_MIN_LENGTH,
  validateCompanyName,
} from './customers/validate-company-name';
export { EMAIL_MAX_LENGTH, EMAIL_MESSAGES, validateEmail } from './customers/validate-email';
export { PLAN_MESSAGES, validatePlan } from './customers/validate-plan';
export {
  CUSTOMER_FIELDS,
  TAX_ID_FIELD_MESSAGES,
  UNKNOWN_FIELD_MESSAGE,
  validateCustomerInput,
} from './customers/validate-customer-input';
export type { CustomerInputResult } from './customers/validate-customer-input';

export {
  TAX_ID_MESSAGES,
  checksumError,
  countryPrefixError,
  countryPrefixMessage,
  formatError,
  taxIdOk,
} from './taxid/result';
export type { FormatReason, TaxIdError, TaxIdResult } from './taxid/result';
export { digitsOf, doubleAndReduce, isAllZeros, isDigits } from './taxid/digits';
export { normalizeTaxId } from './taxid/normalize-tax-id';
export { validateDniNie } from './taxid/es-dni-nie';
export { validateCif } from './taxid/es-cif';
export { validateEsTaxId } from './taxid/es';
export { validatePtNif } from './taxid/pt-nif';
export { validateFrSiren } from './taxid/fr-siren';
export { validateDeVat } from './taxid/de-vat';
export { validateItPiva } from './taxid/it-piva';
export { validateGbVat } from './taxid/gb-vat';
export {
  GENERIC_TAX_ID_LENGTH_MESSAGE,
  GENERIC_TAX_ID_MAX_LENGTH,
  GENERIC_TAX_ID_MIN_LENGTH,
  validateGenericTaxId,
} from './taxid/generic';
export {
  TAX_ID_REQUIRED_MESSAGE,
  validateNormalizedTaxId,
  validateTaxId,
} from './taxid/validate-tax-id';

export { trimWhitespace } from './text/whitespace';
export { codePointLength, hasControlChars } from './text/code-points';
export { toSearchKey } from './text/search-key';
export { compareByNameEs, sortByNameEs } from './search/sort-customers';
export type { Named } from './search/sort-customers';

export { MAX_USERS, PRICING_TIERS } from './pricing/tiers';
export type { PricingTier, TierNumber } from './pricing/tiers';
export type {
  BaseCost,
  BaseCostResult,
  PricingResult,
  Quote,
  QuoteResult,
  TierLine,
} from './pricing/types';
export { USERS_MESSAGES, validateUsers } from './pricing/validate-users';
export { INPUT_MESSAGES } from './pricing/pricing-input';
export { calculateBaseCost } from './pricing/calculate-base-cost';
export { VAT_RATES_PERCENT, vatRatePercentFor } from './pricing/vat-rates';
export type { VatTableCountry } from './pricing/vat-rates';
export { validateVatCountry } from './pricing/validate-vat-country';
export { calculateQuote } from './pricing/calculate-quote';

export {
  CURRENCIES,
  EUR_MICROS,
  MICROS_PER_UNIT,
  RATE_MAX_MICROS,
  RATE_MIN_MICROS,
} from './currency/types';
export type { ConvertedAmounts, Currency, ForeignCurrency, RateMicros } from './currency/types';
export { parseRateText } from './currency/parse-rate';
export type { ParseRateResult } from './currency/parse-rate';
export { formatRate } from './currency/format-rate';
export { convertCents } from './currency/convert-cents';
export { convertQuote } from './currency/convert-quote';
export { CURRENCY_MESSAGES, validateCurrency } from './currency/validate-currency';

export { RESOURCE_MAX, SIMULATION_FIELDS } from './simulations/types';
export type { Simulation, SimulationInput } from './simulations/types';
export { RESOURCE_MESSAGES, validateResource } from './simulations/validate-resource';
export { CUSTOMER_REF_MESSAGES, validateCustomerRef } from './simulations/validate-customer-ref';
export { validateSimulationInput } from './simulations/validate-simulation-input';
export type { SimulationInputResult } from './simulations/validate-simulation-input';

export { PAGE_SIZE, lastPage, pageRange, pageWindow, paginate, parsePageParam } from './pagination/pagination';
export type { PageItem, PageSlice } from './pagination/pagination';
