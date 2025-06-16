'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Check, ArrowRight, MapPin, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toPersianNumber } from '@/lib/utils';
import type { Address, CartWithItems, AddressFormData } from '@/types/cart';

interface AddressFormClientProps {
  initialAddresses: Address[];
  cart: CartWithItems;
}

export function AddressFormClient({ initialAddresses, cart }: AddressFormClientProps) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    initialAddresses.find(addr => addr.is_default)?.id || initialAddresses[0]?.id || null
  );
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AddressFormData>({
    full_name: '',
    phone_number: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'Afghanistan',
    is_default: false,
  });

  const handleInputChange = (field: keyof AddressFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const saveNewAddress = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save address');
      }

      const { address } = await response.json();
      setAddresses(prev => [address, ...prev]);
      setSelectedAddressId(address.id);
      setShowNewAddressForm(false);
      
      // Reset form
      setFormData({
        full_name: '',
        phone_number: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'Afghanistan',
        is_default: false,
      });
    } catch (error) {
      console.error('Failed to save address:', error);
      alert('خطا در ذخیره آدرس');
    } finally {
      setLoading(false);
    }
  };

  const proceedToPayment = () => {
    if (!selectedAddressId) {
      alert('لطفاً آدرس تحویل را انتخاب کنید');
      return;
    }

    // Store selected address in session storage for the payment step
    sessionStorage.setItem('selectedAddressId', selectedAddressId);
    router.push('/checkout/payment');
  };

  return (
    <div className="min-h-screen bg-pink-50" dir="rtl">
      {/* Main Content */}
      <div className="pb-32"> {/* Bottom padding for fixed checkout */}
        <div className="px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => router.back()}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"
            >
              <ArrowRight className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">آدرس تحویل</h1>
            <div className="w-10"></div> {/* Spacer */}
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-4">
              {/* Step 1 - Cart */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-gray-600 hidden sm:block">سبد خرید</span>
              </div>
              
              <div className="w-8 h-px bg-pink-300"></div>
              
              {/* Step 2 - Address */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <span className="text-sm font-medium text-gray-800 hidden sm:block">آدرس</span>
              </div>
              
              <div className="w-8 h-px bg-gray-300"></div>
              
              {/* Step 3 - Payment */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-bold">3</span>
                </div>
                <span className="text-sm text-gray-500 hidden sm:block">پرداخت</span>
              </div>
            </div>
          </div>

          {/* Address Selection */}
          <div className="space-y-4">
            {/* Existing Addresses */}
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-white rounded-2xl p-4 shadow-sm cursor-pointer transition-all ${
                  selectedAddressId === address.id
                    ? 'border-2 border-pink-500 bg-pink-50'
                    : 'border border-gray-100'
                }`}
                onClick={() => setSelectedAddressId(address.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Selection Indicator */}
                  <div className="flex-shrink-0 mt-1">
                    {selectedAddressId === address.id ? (
                      <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                    )}
                  </div>

                  {/* Address Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <h3 className="font-semibold text-gray-800">{address.full_name}</h3>
                      {address.is_default && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          پیش‌فرض
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <p className="text-gray-600">{address.phone_number}</p>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div className="text-gray-600">
                        <p className="leading-relaxed">
                          {address.address_line_1}
                          {address.address_line_2 && `, ${address.address_line_2}`}
                        </p>
                        <p className="text-sm">
                          {address.city}, {address.state} {address.zip_code}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add New Address */}
            {!showNewAddressForm && (
              <button
                onClick={() => setShowNewAddressForm(true)}
                className="w-full bg-white border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-pink-300 hover:bg-pink-50 transition-all"
              >
                <Plus className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <span className="text-gray-600 font-medium">افزودن آدرس جدید</span>
              </button>
            )}

            {/* New Address Form */}
            {showNewAddressForm && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-800">آدرس جدید</h3>
                  <button
                    onClick={() => setShowNewAddressForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="full_name" className="text-gray-700 font-medium mb-2 block">نام و نام خانوادگی</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      className="bg-gray-50 border-gray-200 rounded-xl text-right"
                      placeholder="نام کامل خود را وارد کنید"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone_number" className="text-gray-700 font-medium mb-2 block">شماره تلفن</Label>
                    <Input
                      id="phone_number"
                      value={formData.phone_number}
                      onChange={(e) => handleInputChange('phone_number', e.target.value)}
                      className="bg-gray-50 border-gray-200 rounded-xl text-right"
                      placeholder="شماره تلفن همراه"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="address_line_1" className="text-gray-700 font-medium mb-2 block">آدرس کامل</Label>
                    <Input
                      id="address_line_1"
                      value={formData.address_line_1}
                      onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                      className="bg-gray-50 border-gray-200 rounded-xl text-right"
                      placeholder="آدرس کامل محل سکونت"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city" className="text-gray-700 font-medium mb-2 block">شهر</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="bg-gray-50 border-gray-200 rounded-xl text-right"
                        placeholder="شهر"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="state" className="text-gray-700 font-medium mb-2 block">استان</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className="bg-gray-50 border-gray-200 rounded-xl text-right"
                        placeholder="استان"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={saveNewAddress}
                    disabled={loading || !formData.full_name || !formData.phone_number || !formData.address_line_1}
                    className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-xl font-semibold"
                  >
                    {loading ? 'در حال ذخیره...' : 'ذخیره آدرس'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Checkout Section */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-lg">
        <div className="max-w-md mx-auto">
          {/* Total Amount */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-medium text-gray-700">مجموع قیمت</span>
            <span className="text-2xl font-bold text-gray-900">
              ؋ {toPersianNumber(cart.total_amount.toLocaleString())}
            </span>
          </div>

          {/* Continue Button */}
          <Button 
            className="w-full bg-pink-500 hover:bg-pink-600 text-white py-4 text-lg font-semibold rounded-2xl shadow-lg"
            onClick={proceedToPayment}
            disabled={!selectedAddressId}
          >
            <div className="flex items-center justify-center gap-2">
              <span>ادامه به پرداخت</span>
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <ArrowRight className="w-4 h-4 rotate-180" />
              </div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
} 