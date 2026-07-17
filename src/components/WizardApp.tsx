import { useState, useEffect } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'motion/react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

// Interfaces
interface Customer {
    grooms_name: string;
    brides_name: string;
    guest_count: number;
    wedding_date: string;
    phone_number: string;
    referral_code?: string;
}
interface VenueType { name: string; image: string }
interface Venue { id: number; name: string; image: string; description: string; price: number; portofolio_link: string }
interface Catering { id: number; name: string; image: string; type: string; buffet_price: number; gubugan_price: number; dessert_price: number; base_price: number; description: string; portofolio_link: string }
interface VendorCategory { id: number; name: string }
interface Vendor { id: number; name: string; image: string; description: string; price: number; portofolio_link: string; is_mandatory?: boolean }
interface Discount { id: number; name: string; description: string; percentage: number; amount: number }

// Use Vite environment variable (must be prefixed with VITE_)
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '');
// Animation variants
const variants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d < 0 ? 300 : -300, opacity: 0 }),
};
const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;

function SanitizedDescription({ html }: { html: string }) {
    return (
        <div
            className="mb-2 max-h-40 overflow-y-auto overscroll-contain pr-2 [&_p]:mb-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-1"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
        />
    );
}

export default function WizardApp() {
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(0);
    const VENDOR_STEP_START = 6;

    const [form, setForm] = useState({
        customer: { grooms_name: '', brides_name: '', guest_count: 0, wedding_date: '', phone_number: '', referral_code: '' } as Customer,
        venue_type: '',
        venue_id: null as number | null,
        catering_id: null as number | null,
        vendors: [] as Array<{ id: number; estimated_price: number; is_mandatory?: boolean }>,
        discount_ids: [] as number[],
    });

    const [venueTypes, setVenueTypes] = useState<VenueType[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [caterings, setCaterings] = useState<Catering[]>([]);
    const [filteredVendorCategories, setFilteredVendorCategories] = useState<VendorCategory[]>([]);
    const [vendors, setVendors] = useState<Record<number, Vendor[]>>({});
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [loading, setLoading] = useState({ venues: false, caterings: false, vendorCategories: false, vendors: false, discounts: false });

    useEffect(() => {
        // initialize date & fetch types
        const today = new Date().toISOString().split('T')[0];
        setForm(f => ({ ...f, customer: { ...f.customer, wedding_date: today } }));
        fetchVenueTypes();
    }, []);

    // Fetch helpers
    const fetchVenueTypes = async () => {
        const res = await fetch(`${BASE_URL}/venue-types`);
        const { types } = await res.json(); setVenueTypes(types);
    };
    const fetchVenues = async () => {
        setLoading(l => ({ ...l, venues: true }));
        const params = new URLSearchParams({ type: form.venue_type, guest_count: String(form.customer.guest_count), referral_code: form.customer.referral_code || '' });
        const res = await fetch(`${BASE_URL}/venues?${params}`);
        const { venues } = await res.json(); setVenues(venues);
        setLoading(l => ({ ...l, venues: false }));
    };
    const fetchCaterings = async () => {
        setLoading(l => ({ ...l, caterings: true }));
        const params = new URLSearchParams({ venue_id: String(form.venue_id), referral_code: form.customer.referral_code || '' });
        const res = await fetch(`${BASE_URL}/caterings?${params}`);
        const { caterings } = await res.json(); setCaterings(caterings);
        setLoading(l => ({ ...l, caterings: false }));
    };

    const fetchVendorCategoriesAndVendors = async () => {
        setLoading(l => ({ ...l, vendorCategories: true, vendors: true }));
        const catRes = await fetch(`${BASE_URL}/vendor-categories`);
        const { categories }: { categories: VendorCategory[] } = await catRes.json();

        // Fetch vendors for all categories in parallel
        const vendorFetches = await Promise.all(
            categories.map(async (cat) => {
                const params = new URLSearchParams({
                    category_id: String(cat.id),
                    venue_id: String(form.venue_id),
                    referral_code: form.customer.referral_code || '',
                });
                const vRes = await fetch(`${BASE_URL}/vendors?${params}`);
                const { vendors: vendorList } = await vRes.json();
                return { catId: cat.id, vendors: vendorList };
            })
        );

        // Build the vendors map
        const vendorsMap: Record<number, Vendor[]> = {};
        vendorFetches.forEach(({ catId, vendors }) => {
            vendorsMap[catId] = vendors;
        });
        setVendors(vendorsMap);

        // Filter categories with at least 1 vendor
        const nonEmptyCategories = categories.filter(cat => vendorsMap[cat.id] && vendorsMap[cat.id].length > 0);
        setFilteredVendorCategories(nonEmptyCategories);

        setLoading(l => ({ ...l, vendorCategories: false, vendors: false }));
    };

    const fetchDiscounts = async () => {
        setLoading(l => ({ ...l, discounts: true }));
        const vendorIds = form.vendors.map(v => v.id).join(',');
        const params = new URLSearchParams({ venue_id: String(form.venue_id), catering_id: String(form.catering_id), vendor_ids: vendorIds });
        const res = await fetch(`${BASE_URL}/discounts?${params}`);
        const { discounts } = await res.json(); setDiscounts(discounts);
        setLoading(l => ({ ...l, discounts: false }));
    };

    useEffect(() => {
        if (step === VENDOR_STEP_START + filteredVendorCategories.length) {
            fetchDiscounts();
        }
    }, [step, filteredVendorCategories.length]);

    const submitForm = async () => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        const res = await fetch(`${BASE_URL}/wedding`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token },
            body: JSON.stringify(form),
        });
        const result = await res.json();
        if (result.success) window.location.href = `${BACKEND_URL}/recap/${result.recap_link}`;
        else alert('Error: ' + result.message);
    };

    // Navigation
    const paginate = (dir: number) => { setDirection(dir); setStep(s => s + dir); };
    const handleDragEnd = (_: MouseEvent | TouchEvent, info: PanInfo) => {
        const swipe = swipePower(info.offset.x, info.velocity.x);
        if (swipe < -swipeConfidenceThreshold) paginate(1);
        if (swipe > swipeConfidenceThreshold) paginate(-1);
    };
    const canNext = () => {
        if (step === 1) return true;
        if (step === 2) {
            const c = form.customer;
            return !!(c.grooms_name && c.brides_name && c.guest_count > 0 && c.wedding_date && c.phone_number);
        }
        if (step === 3) return !!form.venue_type;
        if (step === 4) return !!form.venue_id;
        if (step === 5) return !!form.catering_id;
        if (step >= VENDOR_STEP_START && step < VENDOR_STEP_START + filteredVendorCategories.length) return true;
        if (step === VENDOR_STEP_START + filteredVendorCategories.length) return true;
        return false;
    };

    // Selection helpers
    const selectVenueType = (type: string) => setForm(f => ({ ...f, venue_type: type }));
    const selectVenue = (v: Venue) => setForm(f => ({ ...f, venue_id: v.id }));
    const selectCatering = (c: Catering) => setForm(f => ({ ...f, catering_id: c.id }));
    const isVendorSelected = (id: number) => form.vendors.some(v => v.id === id);
    const toggleVendor = (v: Vendor) => {
        setForm(f => {
            const exists = f.vendors.some(x => x.id === v.id);
            const list = exists ? f.vendors.filter(x => x.id !== v.id) : [...f.vendors, { id: v.id, estimated_price: v.price, is_mandatory: v.is_mandatory }];
            return { ...f, vendors: list };
        });
    };

    // Render
    const renderStep = () => {
        // Step 1 Landing
        if (step === 1) return (
            <div className="p-6 max-w-2xl w-full mx-auto overflow-hidden">
                <div className="text-center">
                    <img src="/images/logo.jpg" alt="Logo" className="mx-auto w-128 mb-4" />
                    <button className="mt-4 px-6 py-2 bg-amber-400 text-black font-bold rounded-lg hover:bg-amber-500 transition" onClick={() => paginate(1)}>Start Planning</button>
                </div>
            </div>
        );

        // Step 2 Customer
        if (step === 2) return (
            <div className="bg-white text-gray-900 rounded-xl shadow-xl/30 p-6 max-w-xl w-full mx-auto overflow-hidden">
                <div>
                    <h2 className="text-2xl font-bold mb-6 text-center">Tell Us About Yourselves</h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="grooms_name" className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap Pengantin Pria</label>
                                <input id="grooms_name" type="text" className="input w-full p-2 border border-gray-300 rounded-md" value={form.customer.grooms_name} onChange={e => setForm(f => ({ ...f, customer: { ...f.customer, grooms_name: e.target.value } }))} />
                            </div>
                            <div>
                                <label htmlFor="brides_name" className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap Pengantin Wanita</label>
                                <input id="brides_name" type="text" className="input w-full p-2 border border-gray-300 rounded-md" value={form.customer.brides_name} onChange={e => setForm(f => ({ ...f, customer: { ...f.customer, brides_name: e.target.value } }))} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="guest_count" className="block text-sm font-medium text-gray-700 mb-1">Jumlah Tamu</label>
                                <input id="guest_count" type="number" className="input w-full p-2 border border-gray-300 rounded-md" value={form.customer.guest_count || ''} onChange={e => setForm(f => ({ ...f, customer: { ...f.customer, guest_count: Number(e.target.value) } }))} />
                            </div>
                            <div>
                                <label htmlFor="wedding_date" className="block text-sm font-medium text-gray-700 mb-1">Tanggal Pernikahan</label>
                                <input id="wedding_date" type="date" className="input w-full p-2 border border-gray-300 rounded-md" value={form.customer.wedding_date} onChange={e => setForm(f => ({ ...f, customer: { ...f.customer, wedding_date: e.target.value } }))} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp</label>
                                <input id="phone_number" type="tel" className="input w-full p-2 border border-gray-300 rounded-md" value={form.customer.phone_number} onChange={e => setForm(f => ({ ...f, customer: { ...f.customer, phone_number: e.target.value } }))} />
                            </div>
                            <div>
                                <label htmlFor="referral_code" className="block text-sm font-medium text-gray-700 mb-1">Kode Referral (opsional)</label>
                                <input id="referral_code" type="text" className="input w-full p-2 border border-gray-300 rounded-md" value={form.customer.referral_code || ''} onChange={e => setForm(f => ({ ...f, customer: { ...f.customer, referral_code: e.target.value } }))} />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between mt-6">
                        <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300" onClick={() => paginate(-1)}>Back</button>
                        <button
                            disabled={!canNext()}
                            onClick={() => paginate(1)}
                            className="px-4 py-2 bg-amber-400 text-black rounded-md hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        );

        // Step 3 Venue Type
        if (step === 3) return (
            <div className="bg-white text-gray-900 rounded-xl shadow p-6 max-w-4xl w-full mx-auto overflow-hidden">
                <div>
                    <h2 className="text-2xl font-bold mb-4 text-center">Choose Your Venue Type</h2>
                    <div className="grid max-h-[65dvh] grid-cols-1 gap-4 overflow-y-auto overscroll-contain p-2 sm:grid-cols-2 lg:grid-cols-3">
                        {venueTypes.map(type => (
                            <div
                                key={type.name}
                                onClick={() => selectVenueType(type.name)}
                                className={`group relative h-40 cursor-pointer overflow-hidden rounded-xl border-4 transition sm:h-56 lg:h-64 ${form.venue_type === type.name ? 'border-amber-400 shadow-xl' : 'border-transparent hover:border-gray-300 hover:shadow-lg'}`}
                            >
                                <img
                                    src={type.image}
                                    alt={type.name}
                                    className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                                <div className="relative z-10 flex h-full items-end justify-center p-4 text-center text-white">
                                    <h3 title={type.name} className="line-clamp-3 text-lg font-bold leading-tight drop-shadow-md">
                                        {type.name}
                                    </h3>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-6">
                        <Button variant="secondary" onClick={() => paginate(-1)}>Back</Button>
                        <Button disabled={!canNext()} onClick={() => { fetchVenues(); paginate(1); }}>Next</Button>
                    </div>
                </div>
            </div>
        );

        // Step 4 Venue Selection
        if (step === 4) return (
            <div className="bg-white text-gray-900 rounded-xl shadow p-6 max-w-4xl w-full mx-auto overflow-hidden">
                <div>
                    <h2 className="text-2xl font-bold mb-4 text-center">Select a Venue</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-2">
                        {loading.venues ? <p>Loading...</p> : venues.length === 0 ? <p>No venues found.</p> : venues.map(v => (
                            <div
                                key={v.id}
                                onClick={() => selectVenue(v)}
                                className={`group relative min-h-64 cursor-pointer overflow-hidden rounded-xl border-4 transition ${form.venue_id === v.id ? 'border-amber-400 shadow-xl' : 'border-transparent hover:border-gray-300 hover:shadow-lg'}`}
                            >
                                <img
                                    src={v.image}
                                    alt={v.name}
                                    className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                                <div className="relative z-10 flex min-h-64 flex-col items-center justify-end p-4 text-center text-white">
                                    <h3
                                        title={v.name}
                                        className="mb-3 line-clamp-3 min-h-[3.75rem] text-base font-bold leading-tight drop-shadow-md"
                                    >
                                        {v.name}
                                    </h3>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <button
                                                onClick={(e) => e.stopPropagation()}
                                                className="rounded-full border border-white/70 bg-black/35 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white hover:text-gray-900"
                                            >
                                                Details
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-white">
                                            <h3 className="text-xl font-bold mb-2">{v.name}</h3>
                                            <img src={v.image} alt="" className="w-full h-48 object-cover mb-2 rounded-md" />
                                            <SanitizedDescription html={v.description} />
                                            <a href={v.portofolio_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                View Portfolio
                                            </a>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-6">
                        <button
                            onClick={() => paginate(-1)}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                        >
                            Back
                        </button>
                        <button
                            disabled={!canNext()}
                            onClick={() => { fetchCaterings(); paginate(1); }}
                            className="px-4 py-2 bg-amber-400 text-black rounded-md hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        );

        // Step 5 Catering Selection
        if (step === 5) return (
            <div className="bg-white text-gray-900 rounded-xl shadow p-6 max-w-4xl w-full mx-auto overflow-hidden">
                <div>
                    <h2 className="text-2xl font-bold mb-4 text-center">Choose Your Catering</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-2">
                        {loading.caterings ? <p>Loading...</p> : caterings.length === 0 ? <p>No caterings found.</p> : caterings.map(c => (
                            <div
                                key={c.id}
                                onClick={() => selectCatering(c)}
                                className={`group relative min-h-64 cursor-pointer overflow-hidden rounded-xl border-4 transition ${form.catering_id === c.id ? 'border-amber-400 shadow-xl' : 'border-transparent hover:border-gray-300 hover:shadow-lg'}`}
                            >
                                <img src={c.image} alt={c.name} className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                                <div className="relative z-10 flex min-h-64 flex-col items-center justify-end p-4 text-center text-white">
                                    <h3 title={c.name} className="mb-3 line-clamp-3 min-h-[3.75rem] text-base font-bold leading-tight drop-shadow-md">{c.name}</h3>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <button
                                                onClick={(e) => e.stopPropagation()}
                                                className="rounded-full border border-white/70 bg-black/35 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white hover:text-gray-900"
                                            >
                                                Details
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-white">
                                            <h3 className="text-xl font-bold mb-2">{c.name}</h3>
                                            <img src={c.image} alt="" className="w-full h-48 object-cover mb-2 rounded-md" />
                                            <SanitizedDescription html={c.description} />
                                            <a href={c.portofolio_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                View Portfolio
                                            </a>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-6">
                        <Button variant="secondary" onClick={() => paginate(-1)}>Back</Button>
                        <Button disabled={!canNext()} onClick={async () => { await fetchVendorCategoriesAndVendors(); paginate(1); }}>Next</Button>
                    </div>
                </div>
            </div>
        );

        // Steps 6…n Vendor Categories
        const vendorIndex = step - VENDOR_STEP_START;
        if (step >= VENDOR_STEP_START && step < VENDOR_STEP_START + filteredVendorCategories.length) {
            const cat = filteredVendorCategories[vendorIndex];
            const list = vendors[cat.id] || [];
            return (
                <div className="bg-white text-gray-900 rounded-xl shadow p-6 max-w-4xl w-full">
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-center">Select Your {cat.name}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-2">
                            {loading.vendors
                                ? <p>Loading...</p>
                                : list.map(v => (
                                    <div key={v.id} onClick={() => toggleVendor(v)}
                                        className={`group relative min-h-64 cursor-pointer overflow-hidden rounded-xl border-4 transition ${isVendorSelected(v.id) ? 'border-amber-400 shadow-xl' : 'border-transparent hover:border-gray-300 hover:shadow-lg'}`}>
                                        <img src={v.image} alt={v.name} className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                                        <div className="relative z-10 flex min-h-64 flex-col items-center justify-end p-4 text-center text-white">
                                            <h3 title={v.name} className="mb-3 line-clamp-3 min-h-[3.75rem] text-base font-bold leading-tight drop-shadow-md">{v.name}</h3>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <button
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="rounded-full border border-white/70 bg-black/35 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white hover:text-gray-900"
                                                    >
                                                        Details
                                                    </button>
                                                </DialogTrigger>
                                                <DialogContent className="bg-white">
                                                    <h3 className="text-xl font-bold mb-2">{v.name}</h3>
                                                    <img src={v.image} alt="" className="w-full h-48 object-cover mb-2 rounded-md" />
                                                    <SanitizedDescription html={v.description} />
                                                    <a href={v.portofolio_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                        View Portfolio
                                                    </a>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                ))}
                        </div>
                        <div className="flex justify-between mt-6">
                            <Button variant="secondary" onClick={() => paginate(-1)}>Back</Button>
                            <Button disabled={!canNext()} onClick={() => paginate(1)}>Next</Button>
                        </div>
                    </div>
                </div>
            );
        }

        // Discounts Step
        if (step === VENDOR_STEP_START + filteredVendorCategories.length) return (
            <div className="bg-white text-gray-900 rounded-xl shadow p-6 max-w-lg w-full mx-auto overflow-hidden">
                <div>
                    <h2 className="text-2xl font-bold mb-4 text-center">Available Discounts</h2>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        {loading.discounts ? <p>Loading...</p> : discounts.map(d => (
                            <label key={d.id} className="flex items-center p-4 border rounded-lg">
                                <input type="checkbox" value={d.id} checked={form.discount_ids.includes(d.id)} onChange={e => {
                                    const id = d.id;
                                    setForm(f => ({ ...f, discount_ids: e.target.checked ? [...f.discount_ids, id] : f.discount_ids.filter(x => x !== id) }));
                                }} className="mr-3" />
                                <div>
                                    <p className="font-bold">{d.name}</p>
                                    <p className="text-sm">{d.description}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                    <div className="flex justify-between mt-6">
                        <Button variant="secondary" onClick={() => paginate(-1)}>Back</Button>
                        <Button onClick={submitForm}>Submit & View Recap</Button>
                    </div>
                </div>
            </div>
        );

        return <div className="bg-white text-gray-900 rounded-xl shadow p-6 max-w-lg w-full mx-auto overflow-hidden"><div>Unknown step</div></div>;
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center" style={{ backgroundImage: "url('/images/bg.png')" }}>
            <div style={{ width: '100%', maxWidth: 768, minHeight: 600, position: 'relative' }}>
                <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                        key={step}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ x: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={handleDragEnd}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                    >
                        {renderStep()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
