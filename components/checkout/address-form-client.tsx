'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Check } from 'lucide-react';
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Address Selection */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium text-right">انتخاب آدرس تحویل</h2>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Existing Addresses */}
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedAddressId === address.id
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedAddressId(address.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{address.full_name}</h3>
                      {address.is_default && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          پیش‌فرض
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{address.phone_number}</p>
                    <p className="text-sm text-gray-600">
                      {address.address_line_1}
                      {address.address_line_2 && `, ${address.address_line_2}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {address.city}, {address.state} {address.zip_code}
                    </p>
                    <p className="text-sm text-gray-600">{address.country}</p>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {selectedAddressId === address.id ? (
                      <div className="w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Add New Address Button */}
            {!showNewAddressForm && (
              <button
                onClick={() => setShowNewAddressForm(true)}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
              >
                <Plus className="mx-auto h-6 w-6 text-gray-400 mb-2" />
                <span className="text-gray-600">افزودن آدرس جدید</span>
              </button>
            )}

            {/* New Address Form */}
            {showNewAddressForm && (
              <div className="border rounded-lg p-6 bg-gray-50">
                <h3 className="text-lg font-medium text-right mb-4">آدرس جدید</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name" className="text-right block mb-2">نام و نام خانوادگی</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      className="text-right"
                      placeholder="نام کامل خود را وارد کنید"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone_number" className="text-right block mb-2">شماره تلفن</Label>
                    <Input
                      id="phone_number"
                      value={formData.phone_number}
                      onChange={(e) => handleInputChange('phone_number', e.target.value)}
                      className="text-right"
                      placeholder="شماره تلفن همراه"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="address_line_1" className="text-right block mb-2">آدرس</Label>
                    <Input
                      id="address_line_1"
                      value={formData.address_line_1}
                      onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                      className="text-right"
                      placeholder="آدرس کامل"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="city" className="text-right block mb-2">شهر</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="text-right"
                      placeholder="نام شهر"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="zip_code" className="text-right block mb-2">کد پستی</Label>
                    <Input
                      id="zip_code"
                      value={formData.zip_code}
                      onChange={(e) => handleInputChange('zip_code', e.target.value)}
                      className="text-right"
                      placeholder="کد پستی"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={(e) => handleInputChange('is_default', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="is_default" className="text-sm">
                    به عنوان آدرس پیش‌فرض ذخیره شود
                  </Label>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={saveNewAddress}
                    disabled={loading || !formData.full_name || !formData.phone_number || !formData.address_line_1 || !formData.city}
                    className="bg-pink-500 hover:bg-pink-600 text-white"
                  >
                    {loading ? 'در حال ذخیره...' : 'ذخیره آدرس'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewAddressForm(false)}
                  >
                    انصراف
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-sm border sticky top-4">
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium text-right">خلاصه سفارش</h2>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex justify-between text-sm">
              <span>قیمت کالاها ({toPersianNumber(cart.total_items)})</span>
              <span>{toPersianNumber(cart.total_amount.toLocaleString())} ؋</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>هزینه ارسال</span>
              <span className="text-green-600">رایگان</span>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between font-medium">
                <span>مجموع</span>
                <span className="text-lg">{toPersianNumber(cart.total_amount.toLocaleString())} ؋</span>
              </div>
            </div>
            
            <Button 
              className="w-full bg-pink-500 hover:bg-pink-600 text-white mt-6"
              onClick={proceedToPayment}
              disabled={!selectedAddressId}
            >
              ادامه به پرداخت
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push('/cart')}
            >
              بازگشت به سبد خرید
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 