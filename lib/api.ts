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

const BASE_URL = 'https://aysha.erpgulf.com/api/method/stocker.stocker.api.get_items';

export async function getItems(barcode?: string, token?: string): Promise<GetItemsResponse> {
  const url = new URL(BASE_URL);
  if (barcode && barcode.trim().length > 0) {
    url.searchParams.set('barcode', barcode.trim());
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Mirrors provided curl; server appears to accept Guest session
      'Cookie': 'full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image=',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`getItems failed: ${res.status} ${res.statusText} - ${text}`);
  }

  // The backend may return the payload in different keys (data/message)
  return res.json();
}

type BarcodeEntry = { id?: string; barcode?: string; uom?: string };
type UomEntry = { id?: string; uom?: string; conversion_factor?: number; price?: number; barcode?: string };
type ItemRaw = {
  item_id?: string;
  item_code?: string;
  item_name?: string;
  description?: string;
  item_group?: string;
  barcodes?: BarcodeEntry[];
  uom?: UomEntry[];
  [key: string]: any;
};

/**
 * Normalize nested response shape like:
 * { data: [ { item_group: string, items: ItemRaw[] } ] }
 * into a flat Item[] convenient for UI.
 */
export function normalizeItemsFromResponse(json: any, preferBarcode?: string): Item[] {
  const groups: any[] = json?.data ?? json?.message ?? [];
  const items: ItemRaw[] = Array.isArray(groups)
    ? groups.flatMap((g) => Array.isArray(g?.items) ? g.items : [])
    : [];

  return items.map((it) => {
    // Choose a display UOM: priority to the one matching barcode, else first available
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

export async function getNormalizedItems(barcode?: string, token?: string): Promise<Item[]> {
  const json = await getItems(barcode, token);
  return normalizeItemsFromResponse(json, barcode);
}
