'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Upload, Save, Image as ImageIcon, CheckCircle, Link, X, Check, Store, Plus, Trash2, Edit2, Eye, EyeOff, Copy, ExternalLink, AlertCircle } from 'lucide-react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// Types for Shopify Stores
interface ShopifyStore {
    id: string;
    name: string;
    domain: string;
    webhookSecret?: string;
    isActive: boolean;
    createdAt: string;
}

// Helper function to create cropped image
function getCroppedImg(image: HTMLImageElement, crop: PixelCrop): Promise<string> {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                throw new Error('Canvas is empty');
            }
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                resolve(reader.result as string);
            };
        }, 'image/jpeg', 0.9);
    });
}

// Helper to center crop
function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
    return centerCrop(
        makeAspectCrop(
            { unit: '%', width: 80 },
            aspect,
            mediaWidth,
            mediaHeight
        ),
        mediaWidth,
        mediaHeight
    );
}

const SettingsView: React.FC = () => {
    const [creatorAvatar, setCreatorAvatar] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Crop state
    const [showCropModal, setShowCropModal] = useState(false);
    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const imgRef = useRef<HTMLImageElement>(null);

    // Shopify Stores state
    const [stores, setStores] = useState<ShopifyStore[]>([]);
    const [loadingStores, setLoadingStores] = useState(true);
    const [showStoreModal, setShowStoreModal] = useState(false);
    const [editingStore, setEditingStore] = useState<ShopifyStore | null>(null);
    const [storeForm, setStoreForm] = useState({ name: '', domain: '', webhookSecret: '' });
    const [savingStore, setSavingStore] = useState(false);
    const [storeError, setStoreError] = useState('');
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Fetch current settings on mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/admin/settings?key=creatorAvatar');
                if (res.ok) {
                    const data = await res.json();
                    if (data.value) {
                        setCreatorAvatar(data.value);
                    }
                }
            } catch (e) {
                console.error('Failed to fetch settings', e);
            }
        };
        fetchSettings();
    }, []);

    // Fetch Shopify stores on mount
    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        try {
            setLoadingStores(true);
            const res = await fetch('/api/admin/shopify-stores');
            if (res.ok) {
                const data = await res.json();
                setStores(data);
            }
        } catch (e) {
            console.error('Failed to fetch stores', e);
        } finally {
            setLoadingStores(false);
        }
    };

    const handleAddStore = () => {
        setEditingStore(null);
        setStoreForm({ name: '', domain: '', webhookSecret: '' });
        setStoreError('');
        setShowStoreModal(true);
    };

    const handleEditStore = (store: ShopifyStore) => {
        setEditingStore(store);
        setStoreForm({
            name: store.name,
            domain: store.domain,
            webhookSecret: '' // Don't show existing secret
        });
        setStoreError('');
        setShowStoreModal(true);
    };

    const handleSaveStore = async () => {
        if (!storeForm.name || !storeForm.domain) {
            setStoreError('Nombre y dominio son requeridos');
            return;
        }
        if (!editingStore && !storeForm.webhookSecret) {
            setStoreError('El Webhook Secret es requerido para nuevas tiendas');
            return;
        }

        setSavingStore(true);
        setStoreError('');

        try {
            const method = editingStore ? 'PUT' : 'POST';
            const body = editingStore
                ? {
                    id: editingStore.id,
                    name: storeForm.name,
                    domain: storeForm.domain,
                    ...(storeForm.webhookSecret && { webhookSecret: storeForm.webhookSecret })
                }
                : storeForm;

            const res = await fetch('/api/admin/shopify-stores', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al guardar');
            }

            setShowStoreModal(false);
            fetchStores();
        } catch (err: any) {
            setStoreError(err.message);
        } finally {
            setSavingStore(false);
        }
    };

    const handleDeleteStore = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta tienda? Los webhooks dejarán de funcionar.')) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/shopify-stores?id=${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchStores();
            }
        } catch (e) {
            console.error('Failed to delete store', e);
        }
    };

    const handleToggleActive = async (store: ShopifyStore) => {
        try {
            const res = await fetch('/api/admin/shopify-stores', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: store.id,
                    isActive: !store.isActive
                })
            });

            if (res.ok) {
                fetchStores();
            }
        } catch (e) {
            console.error('Failed to toggle store', e);
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Handle file select - show crop modal
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('La imagen es muy grande. Por favor usa una imagen menor a 10MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setImgSrc(reader.result as string);
            setShowCropModal(true);
        };
        reader.readAsDataURL(file);
    };

    // When image loads in crop modal
    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, 1)); // 1:1 aspect ratio for profile
    }, []);

    // Apply crop and save automatically
    const handleApplyCrop = async () => {
        if (!imgRef.current || !completedCrop) return;

        try {
            const croppedDataUrl = await getCroppedImg(imgRef.current, completedCrop);
            setCreatorAvatar(croppedDataUrl);
            setShowCropModal(false);
            setImgSrc('');

            // Auto-save after applying crop
            setIsSaving(true);
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'creatorAvatar', value: croppedDataUrl })
            });

            if (res.ok) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            } else {
                throw new Error('Save failed');
            }
        } catch (err) {
            console.error('Crop/Save error:', err);
            alert('Error al guardar la imagen');
        } finally {
            setIsSaving(false);
        }
    };

    // Cancel crop
    const handleCancelCrop = () => {
        setShowCropModal(false);
        setImgSrc('');
        setCrop(undefined);
        setCompletedCrop(undefined);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveSuccess(false);

        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'creatorAvatar', value: creatorAvatar })
            });

            if (res.ok) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            } else {
                throw new Error('Save failed');
            }
        } catch (err) {
            console.error('Save error:', err);
            alert('Error al guardar');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl">
            <div className="flex items-center gap-3 mb-8">
                <Settings className="w-6 h-6 text-purple-500" />
                <h1 className="text-2xl font-bold">Configuración</h1>
            </div>

            {/* Creator Avatar Section */}
            <div className="bg-[#1e1e2e] rounded-xl p-6 border border-white/5">
                <div className="flex items-center gap-2 mb-4">
                    <ImageIcon className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-semibold">Avatar de la Creadora</h2>
                </div>
                <p className="text-sm text-white/50 mb-6">
                    Esta imagen aparecerá en el panel de usuario como foto de perfil. Es universal para todos los usuarios.
                </p>

                <div className="flex items-center gap-6">
                    {/* Avatar Preview */}
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-purple-500/30 bg-black/20">
                            {creatorAvatar ? (
                                <img
                                    src={creatorAvatar}
                                    alt="Creator Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/20">
                                    <ImageIcon className="w-10 h-10" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upload Controls */}
                    <div className="flex-1 space-y-3">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg transition-colors text-sm"
                        >
                            <Upload className="w-4 h-4" />
                            Subir imagen
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={isSaving || !creatorAvatar}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${saveSuccess
                                ? 'bg-green-600/30 text-green-400'
                                : !creatorAvatar
                                    ? 'bg-gray-600/20 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400'
                                }`}
                        >
                            {saveSuccess ? (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    Guardado
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {isSaving ? 'Guardando...' : 'Guardar'}
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* URL Input (optional manual entry) */}
                <div className="mt-6 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <Link className="w-4 h-4 text-white/40" />
                        <label className="text-xs text-white/40">O ingresa una URL directamente:</label>
                    </div>
                    <input
                        type="text"
                        value={creatorAvatar.startsWith('data:') ? '' : creatorAvatar}
                        onChange={(e) => setCreatorAvatar(e.target.value)}
                        placeholder="https://ejemplo.com/mi-imagen.jpg"
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-purple-500 outline-none transition-colors"
                    />
                </div>
            </div>

            {/* Shopify Stores Section */}
            <div className="bg-[#1e1e2e] rounded-xl p-6 border border-white/5 mt-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Store className="w-5 h-5 text-green-400" />
                        <h2 className="text-lg font-semibold">Tiendas Shopify</h2>
                    </div>
                    <button
                        onClick={handleAddStore}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Agregar Tienda
                    </button>
                </div>
                <p className="text-sm text-white/50 mb-6">
                    Conecta tus tiendas Shopify para recibir webhooks de compras y crear usuarios automáticamente.
                </p>

                {/* Webhook URL Info */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <ExternalLink className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-blue-400 mb-1">URL del Webhook</p>
                            <p className="text-xs text-white/60 mb-2">
                                Configura este URL en Shopify → Settings → Notifications → Webhooks
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-black/30 px-3 py-2 rounded text-xs text-green-400 overflow-x-auto">
                                    {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/shopify` : '/api/webhooks/shopify'}
                                </code>
                                <button
                                    onClick={() => copyToClipboard(
                                        typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/shopify` : '/api/webhooks/shopify',
                                        'webhook-url'
                                    )}
                                    className="p-2 hover:bg-white/10 rounded transition-colors"
                                    title="Copiar"
                                >
                                    {copiedId === 'webhook-url' ? (
                                        <Check className="w-4 h-4 text-green-400" />
                                    ) : (
                                        <Copy className="w-4 h-4 text-white/50" />
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-white/40 mt-2">
                                Evento recomendado: <span className="text-yellow-400">Order payment</span> o <span className="text-yellow-400">Order creation</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stores List */}
                {loadingStores ? (
                    <div className="text-center py-8 text-white/40">
                        <div className="w-6 h-6 border-2 border-white/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-2"></div>
                        Cargando tiendas...
                    </div>
                ) : stores.length === 0 ? (
                    <div className="text-center py-8 text-white/40">
                        <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No hay tiendas configuradas</p>
                        <p className="text-xs mt-1">Agrega tu primera tienda para empezar</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {stores.map((store) => (
                            <div
                                key={store.id}
                                className={`bg-black/20 rounded-lg p-4 border transition-colors ${store.isActive ? 'border-green-500/20' : 'border-white/5 opacity-60'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-medium">{store.name}</h3>
                                            <span className={`px-2 py-0.5 rounded text-xs ${store.isActive
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-gray-500/20 text-gray-400'
                                                }`}>
                                                {store.isActive ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-white/50">{store.domain}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleToggleActive(store)}
                                            className={`p-2 rounded-lg transition-colors ${store.isActive
                                                    ? 'hover:bg-yellow-500/20 text-yellow-400'
                                                    : 'hover:bg-green-500/20 text-green-400'
                                                }`}
                                            title={store.isActive ? 'Desactivar' : 'Activar'}
                                        >
                                            {store.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleEditStore(store)}
                                            className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteStore(store.id)}
                                            className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Store Modal */}
            {showStoreModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
                    <div className="bg-[#1e1e2e] rounded-xl p-6 max-w-md w-full mx-4 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">
                                {editingStore ? 'Editar Tienda' : 'Agregar Tienda'}
                            </h3>
                            <button
                                onClick={() => setShowStoreModal(false)}
                                className="text-white/50 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {storeError && (
                            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                                <AlertCircle className="w-4 h-4 text-red-400" />
                                <p className="text-sm text-red-400">{storeError}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-white/60 mb-1">Nombre de la tienda</label>
                                <input
                                    type="text"
                                    value={storeForm.name}
                                    onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                                    placeholder="Mi Tienda"
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:border-purple-500 outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-white/60 mb-1">Dominio de Shopify</label>
                                <input
                                    type="text"
                                    value={storeForm.domain}
                                    onChange={(e) => setStoreForm({ ...storeForm, domain: e.target.value })}
                                    placeholder="mi-tienda.myshopify.com"
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:border-purple-500 outline-none transition-colors"
                                />
                                <p className="text-xs text-white/40 mt-1">Sin https://, solo el dominio</p>
                            </div>

                            <div>
                                <label className="block text-sm text-white/60 mb-1">
                                    Webhook Secret {editingStore && <span className="text-white/30">(dejar vacío para mantener)</span>}
                                </label>
                                <input
                                    type="password"
                                    value={storeForm.webhookSecret}
                                    onChange={(e) => setStoreForm({ ...storeForm, webhookSecret: e.target.value })}
                                    placeholder={editingStore ? '••••••••••••••••' : 'shpss_xxxxx'}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:border-purple-500 outline-none transition-colors"
                                />
                                <p className="text-xs text-white/40 mt-1">
                                    Lo encuentras en Shopify → Settings → Notifications → Webhooks
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end mt-6">
                            <button
                                onClick={() => setShowStoreModal(false)}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveStore}
                                disabled={savingStore}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-sm transition-colors"
                            >
                                {savingStore ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        {editingStore ? 'Guardar Cambios' : 'Agregar Tienda'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Crop Modal */}
            {showCropModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
                    <div className="bg-[#1e1e2e] rounded-xl p-6 max-w-lg w-full mx-4 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Recortar imagen</h3>
                            <button onClick={handleCancelCrop} className="text-white/50 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-white/50 mb-4">
                            Arrastra para seleccionar el área que quieres mostrar
                        </p>

                        <div className="flex justify-center mb-4 bg-black/30 rounded-lg p-4 max-h-[400px] overflow-auto">
                            <ReactCrop
                                crop={crop}
                                onChange={(_, percentCrop) => setCrop(percentCrop)}
                                onComplete={(c) => setCompletedCrop(c)}
                                aspect={1}
                                circularCrop
                            >
                                <img
                                    ref={imgRef}
                                    src={imgSrc}
                                    alt="Crop"
                                    onLoad={onImageLoad}
                                    style={{ maxHeight: '350px' }}
                                />
                            </ReactCrop>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleCancelCrop}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleApplyCrop}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm transition-colors"
                            >
                                <Check className="w-4 h-4" />
                                Aplicar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsView;
