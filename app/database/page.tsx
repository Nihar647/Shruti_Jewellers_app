"use client";

import { useState, useEffect } from "react";
import { getBills, deleteBill, Bill } from "../utils/storage";
import { Search, ChevronDown, ChevronUp, Trash2, Calendar, User, FileText, Smartphone, Send, Download, Notebook } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function DatabasePage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  useEffect(() => {
    const fetchBills = async () => {
      const data = await getBills();
      setBills(data);
    };
    fetchBills();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this bill? This cannot be undone.")) {
      try {
        const updated = await deleteBill(id);
        setBills(updated);
      } catch (error) {
        console.error("Delete failed", error);
        alert("Failed to delete bill from cloud.");
      }
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredBills = bills.filter(b => 
    b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.date.includes(searchTerm)
  );

  const generatePDF = async (bill: Bill) => {
    const input = document.getElementById(`invoice-capture-${bill.id}`);
    if (!input) {
      alert("Error finding print template");
      return;
    }

    setIsGenerating(bill.id);
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
      pdf.save(`Bill_${bill.customerName}_${bill.id.split('-')[0]}.pdf`);
    } catch (error) {
      console.error("PDF Generation failed", error);
    } finally {
      setIsGenerating(null);
    }
  };

  const shareOnWhatsApp = async (bill: Bill) => {
    await generatePDF(bill);
    if (bill.customerPhone) {
      const text = encodeURIComponent(`Hello ${bill.customerName},\n\nRe-sharing your invoice from *Shruti Jewellers* (GSTIN: BRKPK3023K).\n\nTotal Amount: ₹${bill.totalAmount.toLocaleString('en-IN')}\n\nPlease check the attached PDF.\n\nThank you!`);
      window.open(`https://wa.me/91${bill.customerPhone}?text=${text}`, "_blank");
    }
  };

  return (
    <div className="max-w-5xl h-full flex flex-col">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif text-gradient font-bold mb-1">Bills Database</h2>
          <p className="text-muted">Manage and view all customer transactions</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 bg-card border border-card-border focus:border-[#c9a84c] rounded-lg py-2 pl-9 pr-4 text-sm text-foreground placeholder-gray-600 outline-none transition-colors"
          />
        </div>
      </div>

      <div className="glass-panel overflow-hidden flex-1 flex flex-col">
        {filteredBills.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted flex-1">
            <FileText className="w-12 h-12 mb-4 text-card-border" />
            <p className="text-lg">No bills found</p>
            <p className="text-sm">Try adjusting your search or create a new bill.</p>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[70vh] p-4 space-y-3">
            {filteredBills.map((bill) => {
              const dateObj = new Date(bill.date);
              const isExpanded = expandedId === bill.id;

              return (
                <div key={bill.id} className="bg-card border border-card-border rounded-lg overflow-hidden transition-all hover:border-[#c9a84c]/30">
                  {/* Summary Row (Clickable) */}
                  <div 
                    onClick={() => toggleExpand(bill.id)}
                    className="p-4 flex flex-wrap md:flex-nowrap items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-4 min-w-[200px]">
                      <div className="bg-background p-2 rounded text-[#c9a84c]">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{bill.customerName}</div>
                        <div className="text-xs text-muted flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          {bill.customerPhone && (
                            <span className="flex items-center gap-1">
                              <Smartphone className="w-3 h-3" />
                              {bill.customerPhone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 ml-auto">
                      <div className="text-right">
                        <div className="text-xs text-muted">Total Amount</div>
                        <div className="font-bold text-[#c9a84c]">₹{bill.totalAmount.toLocaleString('en-IN')}</div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => handleDelete(bill.id, e)}
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                          title="Delete Bill"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="text-gray-500">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="bg-background p-4 border-t border-card-border">
                      <h4 className="text-sm font-semibold text-muted mb-3 border-b border-card-border pb-2">Purchased Items Details</h4>
                      
                      <div className="space-y-2">
                        {bill.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm p-2 rounded bg-card group">
                            <div className="flex-1 font-medium text-foreground flex items-center gap-2">
                              <span className="text-[10px] text-muted font-mono">{(idx + 1).toString().padStart(2, '0')}</span>
                              {item.itemName}
                            </div>
                            <div className="w-24 text-right text-muted">{item.weight}g</div>
                            <div className="w-24 text-right text-muted">₹{item.rate}/g</div>
                            <div className="w-32 text-right font-medium text-[#d6ba66]">₹{item.cost.toLocaleString('en-IN')}</div>
                          </div>
                        ))}
                      </div>

                      {bill.note && (
                        <div className="mt-4 p-3 rounded bg-blue-500/5 border border-blue-500/20 text-muted">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400 uppercase mb-1">
                            <Notebook className="w-3 h-3" /> Note
                          </div>
                          <div className="text-sm whitespace-pre-wrap">{bill.note}</div>
                        </div>
                      )}

                      <div className="mt-4 pt-3 border-t border-card-border flex flex-col md:flex-row justify-between items-center text-sm text-muted gap-4">
                        <div>
                          <span>Bill ID: <span className="font-mono text-xs">{bill.id.split('-')[0]}</span></span>
                          <span className="ml-4">Time: {dateObj.toLocaleTimeString('en-IN')}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => generatePDF(bill)}
                            disabled={isGenerating === bill.id}
                            className="flex items-center gap-2 bg-gray-700/50 hover:bg-gray-700 text-white px-3 py-1.5 rounded-md border border-gray-600/30 transition-colors disabled:opacity-50"
                          >
                            {isGenerating === bill.id ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Download className="w-4 h-4" />}
                            <span className="text-xs">Download PDF</span>
                          </button>
                          
                          {bill.customerPhone && (
                            <button 
                              onClick={() => shareOnWhatsApp(bill)}
                              className="flex items-center gap-2 bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600 hover:text-white px-3 py-1.5 rounded-md transition-colors"
                            >
                              <Send className="w-4 h-4" /> <span className="text-xs">WhatsApp PDF</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Hidden Invoice for Capture */}
                      <div className="fixed -left-[10000px] top-0">
                        <div id={`invoice-capture-${bill.id}`} className="bg-white p-10 w-[210mm] text-black">
                          <div className="text-center mb-6">
                            <h2 className="text-2xl font-serif font-bold text-black border-b-2 border-black pb-2 mb-2 inline-block px-8 tracking-widest leading-none">TAX INVOICE</h2>
                            <div className="text-sm text-gray-700 font-bold tracking-widest mt-1 uppercase">SHRUTI JEWELLERS</div>
                            <div className="text-xs text-gray-500 mt-1 uppercase">GSTIN: BRKPK3023K</div>
                          </div>

                          <div className="flex justify-between text-sm mb-6 border-b border-gray-200 pb-4">
                            <div>
                              <div className="text-gray-500 text-xs">Billed To:</div>
                              <div className="font-bold text-base mt-1">{bill.customerName}</div>
                              {bill.customerPhone && <div className="text-gray-600 font-mono text-xs mt-1">Ph: {bill.customerPhone}</div>}
                            </div>
                            <div className="text-right">
                              <div className="text-gray-500 text-xs text-right">Bill Index:</div>
                              <div className="font-mono text-xs mt-1 font-semibold uppercase">ID-{bill.id.split('-')[0]}</div>
                              <div className="text-xs mt-1 text-gray-600">{new Date(bill.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
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
                              {bill.items.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-100">
                                  <td className="py-3 font-medium text-gray-800">{item.itemName}</td>
                                  <td className="py-3 text-right text-gray-600 font-medium">{item.weight}g <br/><span className="text-[10px] text-gray-400 font-normal">@₹{item.rate}/g</span></td>
                                  <td className="py-3 text-right font-bold text-gray-900">₹{item.cost.toLocaleString('en-IN')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          <div className="flex justify-between items-center border-t-2 border-black pt-4 mb-2">
                            <div className="font-bold text-lg leading-none uppercase tracking-wide">Grand Total</div>
                            <div className="font-bold text-2xl text-black">₹{bill.totalAmount.toLocaleString('en-IN')}</div>
                          </div>

                          {bill.note && (
                            <div className="mt-4 p-3 bg-gray-50 border-l-4 border-gray-300">
                              <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">NOTES</div>
                              <div className="text-xs text-gray-700 whitespace-pre-wrap">{bill.note}</div>
                            </div>
                          )}

                          <div className="text-center text-xs text-gray-500 mt-20 italic border-t border-gray-200 pt-4">Authentic Jewellery Since 2024. Thank you for your business!</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
