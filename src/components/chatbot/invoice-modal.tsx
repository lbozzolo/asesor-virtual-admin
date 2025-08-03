
"use client";

import { X } from 'lucide-react';

interface InvoiceModalProps {
    customerData: {
        nombre?: string;
        email?: string;
        phone?: string;
        estado?: string;
    } | null;
    onClose: () => void;
}

export const InvoiceModal = ({ customerData, onClose }: InvoiceModalProps) => {
    if (!customerData) return null;

    const invoiceNumber = `INV-${Date.now()}`;
    const invoiceDate = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-8 relative animate-fade-in">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
                <div className="flex justify-between items-start mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 tracking-tighter">Studyx</h1>
                    <div className="text-right">
                        <h2 className="text-2xl font-semibold text-gray-700">FACTURA</h2>
                        <p className="text-gray-500">{invoiceNumber}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="font-semibold text-gray-500 mb-2">FACTURAR A:</h3>
                        <p className="font-bold text-gray-800">{customerData.nombre}</p>
                        <p className="text-gray-600">{customerData.email}</p>
                        <p className="text-gray-600">{customerData.phone}</p>
                        <p className="text-gray-600">{customerData.estado}</p>
                    </div>
                    <div className="text-right">
                        <h3 className="font-semibold text-gray-500 mb-2">FECHA DE FACTURA:</h3>
                        <p className="text-gray-800">{invoiceDate}</p>
                    </div>
                </div>
                <table className="w-full mb-8">
                    <thead><tr className="bg-gray-100 text-left text-gray-600 uppercase text-sm"><th className="p-3">Descripción</th><th className="p-3 text-right">Monto</th></tr></thead>
                    <tbody><tr className="border-b"><td className="p-3">Suscripción Mensual - Acceso Total Studyx</td><td className="p-3 text-right">$25.00</td></tr></tbody>
                </table>
                <div className="flex justify-end">
                    <div className="w-full max-w-xs text-right">
                        <div className="flex justify-between mb-2"><span className="text-gray-600">Subtotal:</span><span className="text-gray-800">$25.00</span></div>
                        <div className="flex justify-between mb-4"><span className="text-gray-600">Impuestos:</span><span className="text-gray-800">$0.00</span></div>
                        <div className="flex justify-between border-t-2 pt-2"><span className="font-bold text-lg text-gray-800">TOTAL PAGADO:</span><span className="font-bold text-lg text-gray-800">$25.00</span></div>
                    </div>
                </div>
                <p className="text-center text-gray-500 text-sm mt-8">Gracias por tu confianza en Studyx!</p>
            </div>
        </div>
    );
};
