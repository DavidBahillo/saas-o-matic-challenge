// Clientes semilla (RF3, plan §6): ES con DNI, NIE y CIF; PT, FR, DE, IT, GB y US; los tres planes.
// Los identificadores pasan los validadores de shared/ (lo comprueba validate-seed.test.ts).
import type { SeedCustomer } from './seed-types';

export const SEED_CUSTOMERS: readonly SeedCustomer[] = [
  { key: 'es-dni', companyName: 'Panadería Los Álamos', taxId: '12345678Z', email: 'admin@alamos.example.com', country: 'ES', plan: 'growth' },
  { key: 'es-nie', companyName: 'Estudio Sol Naciente', taxId: 'X1234567L', email: 'hola@solnaciente.example.com', country: 'ES', plan: 'starter' },
  { key: 'es-cif', companyName: 'Logística Cantábrico SL', taxId: 'B12345674', email: 'compras@cantabrico.example.com', country: 'ES', plan: 'enterprise' },
  { key: 'pt', companyName: 'Atlântico Software Lda', taxId: '501964843', email: 'geral@atlantico.example.com', country: 'PT', plan: 'growth' },
  { key: 'fr', companyName: 'Boulangerie Lumière SAS', taxId: '732829320', email: 'contact@lumiere.example.com', country: 'FR', plan: 'starter' },
  { key: 'de', companyName: 'Rheinwerk Datentechnik GmbH', taxId: '136695976', email: 'info@rheinwerk.example.com', country: 'DE', plan: 'enterprise' },
  { key: 'it', companyName: 'Officine Adriatica Srl', taxId: '00743110157', email: 'ufficio@adriatica.example.com', country: 'IT', plan: 'growth' },
  { key: 'gb', companyName: 'Thames Analytics Ltd', taxId: '980780684', email: 'team@thames.example.com', country: 'GB', plan: 'starter' },
  { key: 'us', companyName: 'Prairie Cloud Works Inc', taxId: '12-3456789', email: 'sales@prairie.example.com', country: 'US', plan: 'enterprise' },
];
