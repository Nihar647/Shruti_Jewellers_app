"use client";

import { useState } from "react";
import { Plus, Trash2, FileText, CheckCircle2, X, Printer, Send, Download } from "lucide-react";
import { saveBill, BillItem, Bill } from "../utils/storage";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function BillingPage() {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<BillItem[]>([
    { id: crypto.randomUUID(), itemName: "", rate: 0, weight: 0, cost: 0, note: "" }
  ]);
  const [isSaved, setIsSaved] = useState(false);
  const [generatedBill, setGeneratedBill] = useState<Bill | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const addItem = () => {
    setItems([
      ...items,
      { id: crypto.randomUUID(), itemName: "", rate: 0, weight: 0, cost: 0, note: "" }
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof BillItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Auto calculate cost when rate or weight changes
        if (field === 'rate' || field === 'weight') {
          const rate = field === 'rate' ? Number(value) : item.rate;
          const weight = field === 'weight' ? Number(value) : item.weight;
          updated.cost = rate * weight;
        }
        return updated;
      }
      return item;
    }));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.cost, 0);

  const handleSaveBill = async () => {
    if (!customerName.trim() || items.some(i => !i.itemName.trim() || i.weight <= 0 || i.rate <= 0)) {
      alert("Please complete all fields with valid information before saving.");
      return;
    }

    const newBill: Bill = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      customerName,
      customerPhone,
      note,
      totalAmount,
      items
    };

    try {
      await saveBill(newBill);
      setIsSaved(true);
      setGeneratedBill(newBill);
    } catch (error: any) {
      console.error("Save failed:", error.message || error);
      alert(`Failed to save bill to cloud: ${error.message || "Unknown error"}`);
    }
  };

  const handleCloseModal = () => {
    setGeneratedBill(null);
    setCustomerName("");
    setCustomerPhone("");
    setNote("");
    setItems([{ id: crypto.randomUUID(), itemName: "", rate: 0, weight: 0, cost: 0, note: "" }]);
    setIsSaved(false);
  };

  const downloadPDF = async () => {
    const input = document.getElementById("printable-bill");
    if (!input) return;

    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Bill_${generatedBill?.customerName || "Customer"}_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("PDF Generation failed", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const shareOnWhatsApp = async () => {
    await downloadPDF();
    if (generatedBill?.customerPhone) {
      const text = encodeURIComponent(`Hello ${generatedBill.customerName},\n\nYour bill from *Shruti Jewellers* (GSTIN: BRKPK3023K) has been generated.\n\nTotal Amount: ₹${generatedBill.totalAmount.toLocaleString('en-IN')}\n\nPlease check the attached PDF for details.\n\nThank you for shopping with us!`);
      window.open(`https://wa.me/91${generatedBill.customerPhone}?text=${text}`, "_blank");
    }
  };

  return (
    <div className="max-w-4xl max-h-full pb-10">
      <div className="mb-6">
        <h2 className="text-3xl font-serif text-gradient font-bold mb-1">Create New Bill</h2>
        <p className="text-muted">Add customer and items for instant calculation</p>
      </div>

      <div className="glass-panel p-6 mb-6">
        <label className="block text-sm font-medium text-muted mb-2">Customer Details</label>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Customer Name"
            className="w-full bg-card border border-card-border focus:border-[#c9a84c] rounded-lg py-2.5 px-4 text-foreground placeholder-gray-600 outline-none transition-colors"
          />
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Phone Number (e.g. 9876543210)"
            className="w-full bg-card border border-card-border focus:border-[#c9a84c] rounded-lg py-2.5 px-4 text-foreground placeholder-gray-600 outline-none transition-colors"
          />
        </div>
        <div className="mt-2">
          <label className="block text-sm font-medium text-muted mb-2">Additional Note (Optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Extra information, e.g. Special order details, hallmarking notes..."
            className="w-full bg-card border border-card-border focus:border-[#c9a84c] rounded-lg py-2 px-4 text-foreground placeholder-gray-600 outline-none transition-colors min-h-[80px] resize-none"
          />
        </div>
      </div>

      <div className="glass-panel p-6">
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-medium text-muted">Jewellery Items</label>
          <button 
            onClick={addItem}
            className="text-xs bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/30 px-3 py-1.5 rounded-md flex items-center gap-1 hover:bg-[#c9a84c]/20 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Item
          </button>
        </div>

        <div className="space-y-3">
          {/* Header Row - Desktop Only */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-2 text-xs font-semibold text-muted uppercase tracking-wider">
            <div className="col-span-1 border-r border-card-border pr-2 text-center">S.No</div>
            <div className="col-span-4 pl-2">Item Name</div>
            <div className="col-span-2">Rate (₹/g)</div>
            <div className="col-span-2">Weight (g)</div>
            <div className="col-span-2 text-right">Cost (₹)</div>
            <div className="col-span-1"></div>
          </div>

          {items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center bg-card p-4 md:p-2 rounded-lg border border-card-border">
              
              <div className="col-span-1 hidden md:flex items-center justify-center font-mono text-muted border-r border-card-border h-full text-sm">
                {index + 1}
              </div>

              <div className="col-span-1 md:col-span-4 md:pl-2">
                <span className="md:hidden text-xs text-muted mb-1 block">S.No {index + 1} - Item Name</span>
                <input
                  type="text"
                  placeholder="e.g. Gold Chain 22k"
                  value={item.itemName}
                  onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                  className="w-full bg-transparent border-b border-card-border focus:border-[#c9a84c] py-1 px-2 text-sm text-foreground outline-none"
                />
                <input
                  type="text"
                  placeholder="Add item note (optional)"
                  value={item.note || ''}
                  onChange={(e) => updateItem(item.id, 'note', e.target.value)}
                  className="w-full bg-transparent py-1 px-2 text-[11px] text-muted outline-none italic"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <span className="md:hidden text-xs text-muted mb-1 block">Rate (₹/g)</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={item.rate || ''}
                  onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent border-b border-card-border focus:border-[#c9a84c] py-1 px-2 text-sm text-foreground outline-none"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <span className="md:hidden text-xs text-muted mb-1 block">Weight (g)</span>
                <input
                  type="number"
                  placeholder="0.000"
                  value={item.weight || ''}
                  onChange={(e) => updateItem(item.id, 'weight', parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent border-b border-card-border focus:border-[#c9a84c] py-1 px-2 text-sm text-foreground outline-none"
                />
              </div>

              <div className="col-span-1 md:col-span-2 text-left md:text-right font-medium text-[#c9a84c]">
                <span className="md:hidden text-xs text-muted mb-1 block">Cost</span>
                ₹{item.cost.toLocaleString('en-IN')}
              </div>

              <div className="col-span-1 flex justify-end">
                <button 
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                  className="p-1.5 text-muted hover:text-red-400 hover:bg-red-400/10 rounded disabled:opacity-30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel p-6 flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
        <div>
          <div className="text-sm text-muted">Total Net Amount</div>
          <div className="text-3xl font-bold text-foreground">
            ₹{totalAmount.toLocaleString('en-IN')}
          </div>
        </div>

        <button 
          onClick={handleSaveBill}
          disabled={isSaved}
          className={`px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${
            isSaved 
              ? "bg-green-500/20 text-green-400 border border-green-500/50" 
              : "bg-[#c9a84c] hover:bg-[#b3923c] text-black"
          }`}
        >
          {isSaved ? <CheckCircle2 className="w-5 h-5"/> : <FileText className="w-5 h-5" />}
          {isSaved ? "Bill Saved Successfully" : "Generate Bill"}
        </button>
      </div>

      {generatedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-background border border-card-border rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-card-border flex justify-between items-center bg-card rounded-t-xl">
              <div>
                <h3 className="text-xl font-serif text-[#c9a84c] font-bold">Shruti Jewellers</h3>
                <p className="text-[10px] text-muted uppercase tracking-wider mt-1">GSTIN: BRKPK3023K</p>
              </div>
              <button onClick={handleCloseModal} className="text-muted hover:text-foreground transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-white print:bg-white text-black" id="printable-bill">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-serif font-bold text-black border-b-2 border-black pb-2 mb-2 inline-block px-8 tracking-widest leading-none">TAX INVOICE</h2>
                <div className="text-sm text-gray-700 font-bold tracking-widest mt-1">SHRUTI JEWELLERS</div>
                <div className="text-xs text-gray-500 mt-1 uppercase">GSTIN: BRKPK3023K</div>
              </div>

              <div className="flex justify-between text-sm mb-6 border-b border-gray-200 pb-4">
                <div>
                  <div className="text-gray-500 text-xs">Billed To:</div>
                  <div className="font-bold text-base mt-1">{generatedBill.customerName}</div>
                  {generatedBill.customerPhone && <div className="text-gray-600 font-mono text-xs mt-1">Ph: {generatedBill.customerPhone}</div>}
                </div>
                <div className="text-right">
                  <div className="text-gray-500 text-xs">Bill Index:</div>
                  <div className="font-mono text-xs mt-1 font-semibold uppercase">ID-{generatedBill.id.split('-')[0]}</div>
                  <div className="text-xs mt-1 text-gray-600">{new Date(generatedBill.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
              </div>

              <table className="w-full text-sm mb-6">
                <thead>
                  <tr className="border-b-2 border-gray-300 text-left text-xs uppercase text-gray-500 tracking-wider">
                    <th className="py-2 font-semibold">Description</th>
                    <th className="py-2 text-right font-semibold w-20">Weight</th>
                    <th className="py-2 text-right font-semibold w-24">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedBill.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-3">
                        <div className="font-medium text-gray-800">{item.itemName}</div>
                        {item.note && <div className="text-[10px] text-gray-400 italic mt-0.5">{item.note}</div>}
                      </td>
                      <td className="py-3 text-right text-gray-600 font-medium">
                        {item.weight}g <br/>
                        <span className="text-[10px] text-gray-400 font-normal">@₹{item.rate}/g</span>
                      </td>
                      <td className="py-3 text-right font-bold text-gray-900">₹{item.cost.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-center border-t-2 border-black pt-4 mb-2">
                <div className="font-bold text-lg leading-none uppercase tracking-wide">Grand Total</div>
                <div className="font-bold text-2xl text-black">₹{generatedBill.totalAmount.toLocaleString('en-IN')}</div>
              </div>

              {generatedBill.note && (
                <div className="mt-4 p-3 bg-gray-50 border-l-4 border-gray-300">
                  <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">NOTES</div>
                  <div className="text-xs text-gray-700 whitespace-pre-wrap">{generatedBill.note}</div>
                </div>
              )}

              <div className="text-center text-xs text-gray-500 mt-10 italic border-t border-gray-200 pt-4">Authentic Jewellery Since 2024. Thank you for your business!</div>
            </div>

            <div className="p-4 border-t border-card-border bg-card rounded-b-xl flex flex-wrap gap-3 justify-end">
              <button 
                onClick={() => window.print()} 
                className="flex flex-1 md:flex-none items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg transition-colors text-sm font-medium border border-gray-600/30"
              >
                <Printer className="w-4 h-4" /> Print Bill
              </button>
              
              <button 
                onClick={downloadPDF}
                disabled={isGeneratingPDF}
                className="flex flex-1 md:flex-none items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isGeneratingPDF ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Download className="w-4 h-4" />}
                Download PDF
              </button>
              
              {generatedBill.customerPhone && (
                <button 
                  onClick={shareOnWhatsApp}
                  className="flex flex-1 md:flex-none items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-lg transition-colors text-sm font-medium"
                >
                  <Send className="w-4 h-4" /> WhatsApp PDF
                </button>
              )}

              <button 
                onClick={handleCloseModal} 
                className="flex flex-1 md:flex-none items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#b3923c] text-black px-6 py-2.5 rounded-lg transition-colors text-sm font-bold shadow-[0_0_15px_rgba(201,168,76,0.2)]"
              >
                <CheckCircle2 className="w-4 h-4" /> Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
