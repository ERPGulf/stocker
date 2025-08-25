import API from '@/lib/http/api';

export type Warehouse = {
  warehouse_id: string;
  warehouse_name: string;
};

const BASE_PATH = '/api/method/stocker.stocker.api.warehouse_list';

export async function getWarehouses(): Promise<Warehouse[]> {
  const res = await API.get(BASE_PATH);
  const json = res.data;
  const list = (json?.data ?? json?.message ?? []) as any[];
  return Array.isArray(list)
    ? list
        .filter((w) => w && (w.warehouse_id || w.warehouse_name))
        .map((w) => ({
          warehouse_id: String(w.warehouse_id ?? ''),
          warehouse_name: String(w.warehouse_name ?? ''),
        }))
    : [];
}
