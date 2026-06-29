import { api } from '@/lib/api';
import UnitsContent from './UnitsContent';

export const revalidate = 60;

export default async function UnitsPage() {
  const units = await api.units.list().catch(() => []);
  return <UnitsContent initialUnits={units} />;
}
