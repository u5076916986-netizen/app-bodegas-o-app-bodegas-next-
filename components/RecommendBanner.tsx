'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface RecommendedProduct {
    id: string;
    nombre: string;
    precio: number;
    categoria: string;
    stock: number;
}

interface RecommendBannerProps {
    tenderoId?: string;
    bodegaId?: string;
    onAddToCart?: (product: RecommendedProduct) => void;
}

export default function RecommendBanner({ tenderoId, bodegaId, onAddToCart }: RecommendBannerProps) {
    const [product, setProduct] = useState<RecommendedProduct | null>(null);
    const [reason, setReason] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [imageUrl, setImageUrl] = useState('/productos/placeholder.svg');
    const pathname = usePathname();

    useEffect(() => {
        fetchRecommendation();

        // Auto-refresh cada 10 minutos SOLO si estamos en /tendero
        if (pathname === '/tendero') {
            const interval = setInterval(() => {
                fetchRecommendation();
            }, 10 * 60 * 1000); // 10 minutos

            return () => clearInterval(interval);
        }
    }, [tenderoId, bodegaId, pathname]);

    const fetchRecommendation = async () => {
        try {
            const params = new URLSearchParams();
            if (tenderoId) params.append('tenderoId', tenderoId);
            if (bodegaId) params.append('bodegaId', bodegaId);

            const res = await fetch(`/api/recomendacion?${params.toString()}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (data.product) {
                    setProduct(data.product);
                    setReason(data.reason || 'Recomendado para ti');

                    // Fetch product image
                    const imgRes = await fetch(`/api/producto-imagen?nombre=${encodeURIComponent(data.product.nombre)}`);
                    if (imgRes.ok) {
                        const imgData = await imgRes.json();
                        setImageUrl(imgData.imageUrl || '/productos/placeholder.svg');
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching recommendation:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!product) return;

        setAdding(true);
        try {
            if (onAddToCart) {
                await onAddToCart(product);
            } else {
                // Si no hay función de carrito, simplemente simular delay
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
        } finally {
            setAdding(false);
        }
    };

    const formatCOP = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="mb-3 animate-pulse">
                <div className="h-20 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"></div>
            </div>
        );
    }

    if (!product) return null;

    return (
        <div className="mb-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm overflow-hidden max-h-[110px]">
            <div className="px-4 py-3 flex items-center justify-between gap-3">
                {/* Mini imagen del producto */}
                <div className="flex-shrink-0 w-16 h-16 bg-white rounded-lg border border-blue-200 overflow-hidden">
                    <Image
                        src={imageUrl}
                        alt={product.nombre}
                        width={64}
                        height={64}
                        className="object-contain w-full h-full"
                        unoptimized
                    />
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-900 mb-0.5 flex items-center gap-1">
                        <span>✨</span>
                        Recomendado hoy
                    </p>
                    <p className="text-sm font-bold text-slate-900 truncate mb-0.5">
                        {product.nombre}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-blue-700">
                            {formatCOP(product.precio)}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-600 truncate">
                            {reason}
                        </span>
                    </div>
                </div>

                {/* Botón */}
                <div className="flex-shrink-0">
                    <button
                        onClick={handleAdd}
                        disabled={adding}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 active:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        {adding ? '...' : 'Agregar rápido'}
                    </button>
                </div>
            </div>
        </div>
    );
}
