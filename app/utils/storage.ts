import { insforge } from '@/lib/insforge';

export interface BillItem {
  id: string;
  itemName: string;
  rate: number;
  weight: number;
  cost: number;
  note?: string;
}

export interface Bill {
  id: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  note?: string;
  totalAmount: number;
  items: BillItem[];
}

// Memory fallback to keep UI snappy while syncing
let billsCache: Bill[] = [];

export const getBills = async (): Promise<Bill[]> => {
  const { data, error } = await insforge.database
    .from('bills')
    .select('*, items(*)');
  
  if (error) {
    console.error('Error fetching bills:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    // Fallback to memory cache
    return billsCache;
  }

  // Map snake_case from DB to camelCase for App
  const bills: Bill[] = data.map((b: any) => ({
    id: b.id,
    date: b.date,
    customerName: b.customer_name,
    customerPhone: b.customer_phone,
    note: b.note,
    totalAmount: Number(b.total_amount),
    items: b.items.map((i: any) => ({
      id: i.id,
      itemName: i.item_name,
      rate: Number(i.rate),
      weight: Number(i.weight),
      cost: Number(i.cost),
      note: i.note
    }))
  }));

  billsCache = bills;
  return bills;
};

export const saveBill = async (bill: Bill) => {
  // 1. Insert Bill
  const { data: billData, error: billError } = await insforge.database
    .from('bills')
    .insert([{
      id: bill.id,
      customer_name: bill.customerName,
      customer_phone: bill.customerPhone,
      total_amount: bill.totalAmount,
      date: bill.date,
      note: bill.note
    }])
    .select()
    .single();

  if (billError) {
    console.error('Bill insert error:', billError.message);
    throw new Error(`Failed to save bill: ${billError.message}`);
  }

  // 2. Insert Items
  const itemsToInsert = bill.items.map(item => ({
    bill_id: billData.id,
    item_name: item.itemName,
    rate: item.rate,
    weight: item.weight,
    cost: item.cost,
    note: item.note
  }));

  const { error: itemsError } = await insforge.database
    .from('items')
    .insert(itemsToInsert);

  if (itemsError) {
    console.error('Items insert error:', itemsError.message);
    throw new Error(`Failed to save bill items: ${itemsError.message}`);
  }

  return await getBills();
};

export const deleteBill = async (id: string) => {
  const { error } = await insforge.database
    .from('bills')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return await getBills();
};

// One-time migration from localStorage to InsForge
export const migrateFromLocal = async () => {
  const localBills = localStorage.getItem("shruti_bills");
  if (!localBills) return;

  const bills: Bill[] = JSON.parse(localBills);
  for (const bill of bills) {
    try {
      await saveBill(bill);
    } catch (e) {
      console.error(`Migration failed for bill ${bill.id}:`, e);
    }
  }
  
  localStorage.removeItem("shruti_bills");
};
