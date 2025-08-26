import API from '@/lib/http/api';

export type Item = {
  item_code?: string;
  item_name?: string;
  uom?: string;
  qty?: number;
  [key: string]: any;
};

export type GetItemsResponse = {
  data?: any;
  message?: any;
  [key: string]: any;
};
// Endpoints
const LIST_BASE_PATH = '/api/method/stocker.stocker.api.list_items';
const DETAIL_BASE_PATH = '/api/method/stocker.stocker.api.get_items';
const STOCK_ENTRIES_PATH = '/api/method/stocker.stocker.api.list_stock_entries';
const DELETE_ENTRY_PATH = '/api/method/stocker.stocker.api.delete_stock_entry';
const CREATE_ENTRY_PATH = '/api/method/stocker.stocker.api.create_stock_entry';
const UPDATE_ENTRY_PATH = '/api/method/stocker.stocker.api.update_stock_entry';

// LIST: items grouped by item_group, filtered by warehouse
export async function listItems(warehouse_id: string): Promise<GetItemsResponse> {
  const params: Record<string, string> = {};
  if (warehouse_id && warehouse_id.trim().length > 0) params.warehouse = warehouse_id.trim();
  const res = await API.get(LIST_BASE_PATH, { params });
  return res.data as GetItemsResponse;
}

// UPDATE STOCK ENTRY
export type UpdateStockPayload = {
  entry_id: string;
  warehouse: string;
  barcode: string;
  shelf: string;
  date: string; // 'YYYY-MM-DD HH:mm:ss'
  item_code: string;
  uom: string;
  qty: number | string;
};

export type UpdateStockResponse = {
  data?: {
    status?: string;
    entry_id?: string;
    warehouse?: string;
    barcode?: string;
    shelf?: string;
    date?: string;
    item_code?: string;
    uom?: string;
    qty?: number | string;
    message?: string; // Added message property for error handling
  };
  message?: string; 
  [key: string]: any;
};

export async function updateStockEntry(payload: UpdateStockPayload): Promise<UpdateStockResponse> {
  const body = new URLSearchParams();
  body.append('entry_id', payload.entry_id);
  body.append('warehouse', payload.warehouse);
  body.append('barcode', payload.barcode);
  body.append('shelf', payload.shelf);
  body.append('date', payload.date);
  body.append('item_code', payload.item_code);
  body.append('uom', payload.uom);
  body.append('qty', String(payload.qty));

  const res = await API.put(UPDATE_ENTRY_PATH, body.toString());
  return res.data as UpdateStockResponse;
}
// CREATE STOCK ENTRY
export type CreateStockPayload = {
  item_id: string; // API expects item_id 
  uom: string;
  qty: number;
  warehouse: string; 
  barcode: string;
  shelf: string;
  date_time?: string; // 'YYYY-MM-DD HH:mm:ss'
};

export type CreateStockResponse = {
  data?: {
    status?: string;
    id?: string;
    item_code?: string;
    warehouse?: string;
    shelf?: string;
    barcode?: string;
    uom?: string;
    qty?: string | number;
    date?: string;
  };
  [key: string]: any;
};

export async function createStockEntry(payload: CreateStockPayload): Promise<CreateStockResponse> {
  const body = new URLSearchParams();
  body.append('item_id', payload.item_id);
  body.append('uom', payload.uom);
  body.append('qty', String(payload.qty));
  body.append('warehouse', payload.warehouse);
  body.append('barcode', payload.barcode);
  body.append('shelf', payload.shelf);
  if (payload.date_time) body.append('date_time', payload.date_time);

  const res = await API.post(CREATE_ENTRY_PATH, body.toString());
  return res.data as CreateStockResponse;
}

// STOCK ENTRIES: list of created entries
export type StockEntry = {
  entry_id?: string;
  warehouse?: string;
  item_code?: string;
  barcode?: string;
  shelf?: string;
  uom?: string;
  qty?: number;
  date?: string;
};

export async function listStockEntries(warehouse?: string): Promise<StockEntry[]> {
  const params: Record<string, string> = {};
  if (warehouse && warehouse.trim().length > 0) params.warehouse = warehouse.trim();
  const res = await API.get(STOCK_ENTRIES_PATH, { params });
  const json = res.data;
  const data = Array.isArray(json?.data) ? json.data : [];
  return data as StockEntry[];
}

// DELETE STOCK ENTRY
export async function deleteStockEntry(entry_id: string): Promise<{ status?: string; message?: string }> {
  console.log('deleteStockEntry called with ID:', entry_id);
  
  if (!entry_id) {
    const errorMsg = 'deleteStockEntry requires entry_id';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    console.log('Sending DELETE request to:', DELETE_ENTRY_PATH);
    const res = await API({
      method: 'DELETE',
      url: DELETE_ENTRY_PATH,
      data: { entry_id },  // Send as request body
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Delete response:', res.data);
    
    if (!res.data) {
      const errorMsg = 'No response data from server';
      console.error(errorMsg);
      return { status: 'error', message: errorMsg };
    }
    
    return res.data as { status?: string; message?: string };
  } catch (error: any) {
    console.error('Error in deleteStockEntry:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    
    // error message from response
    const errorMessage = error.response?.data?.message || error.message || 'Failed to delete entry';
    return { status: 'error', message: errorMessage };
  }
}

// DETAIL: single item by barcode and warehouse
export type ItemDetail = {
  item_id?: string;
  item_name?: string;
  uom?: string;
  total_qty?: number;
  shelf_qty?: number;
};

export async function getItemByBarcode(barcode: string, warehouse_id: string): Promise<ItemDetail | null> {
  const params: Record<string, string> = {};
  if (barcode && barcode.trim().length > 0) params.barcode = barcode.trim();
  if (warehouse_id && warehouse_id.trim().length > 0) params.warehouse = warehouse_id.trim();
  const res = await API.get(DETAIL_BASE_PATH, { params });
  const json = res.data;
  const d = json?.data;
  if (!d) return null;
  return {
    item_id: d.item_id,
    item_name: d.item_name,
    uom: d.uom,
    total_qty: d.total_qty,
    shelf_qty: d.shelf_qty,
  } as ItemDetail;
}

type BarcodeEntry = { id?: string; barcode?: string; uom?: string };
type UomEntry = { id?: string; uom?: string; conversion_factor?: number; price?: number; barcode?: string };
export type ItemRaw = {
  item_id?: string;
  item_code?: string;
  item_name?: string;
  description?: string;
  item_group?: string;
  barcodes?: BarcodeEntry[];
  uom?: UomEntry[];
  [key: string]: any;
};

export function normalizeItemsFromResponse(json: any, preferBarcode?: string): Item[] {
  const groups: any[] = json?.data ?? json?.message ?? [];
  const items: ItemRaw[] = Array.isArray(groups)
    ? groups.flatMap((g) => Array.isArray(g?.items) ? g.items : [])
    : [];

  return items.map((it) => {
    let displayUom: string | undefined = undefined;
    if (preferBarcode && Array.isArray(it?.uom)) {
      const match = it.uom.find((u) => (u?.barcode || '').trim() === preferBarcode?.trim());
      displayUom = match?.uom ?? displayUom;
    }
    if (!displayUom && Array.isArray(it?.uom) && it.uom.length > 0) {
      displayUom = it.uom[0]?.uom;
    }

    return {
      item_code: it.item_code,
      item_name: it.item_name,
      description: it.description,
      uom: displayUom,
      qty: (it as any).qty ?? 0,
      raw: it,
    } as Item;
  });
}
//  list and normalize by warehouse
export async function getNormalizedItemsByWarehouse(warehouse_id: string): Promise<Item[]> {
  const json = await listItems(warehouse_id);
  return normalizeItemsFromResponse(json);
}
