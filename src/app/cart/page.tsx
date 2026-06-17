'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/Header'
import { useApp } from '@/context/AppContext'
import { PURCHASE_ENABLED } from '@/lib/features'
import { Size } from '@/types'
import toast from 'react-hot-toast'

interface CheckoutFormState {
    customerName: string
    phoneNumber: string
    address: string
    note: string
}

const PHONE_REGEX = /^[0-9]{10,11}$/
const getCartItemKey = (productId: string, size: Size) => `${productId}_${size}`

export default function CartPage() {
    if (!PURCHASE_ENABLED) {
        return (
            <>
                <Header />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                    <div className="text-6xl mb-4">🛒</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Tính năng mua hàng đang tạm tắt</h1>
                    <p className="text-gray-500 mb-6">Vui lòng quay lại sau hoặc liên hệ shop để đặt hàng.</p>
                    <Link href="/" className="btn-primary inline-block">
                        Về trang chủ
                    </Link>
                </main>
            </>
        )
    }

    return <CartPageContent />
}

function CartPageContent() {
    const {
        cartItems,
        cartCount,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        createOrder,
    } = useApp()

    const [submitting, setSubmitting] = useState(false)
    const [orderSuccess, setOrderSuccess] = useState(false)
    const [selectedItemKeys, setSelectedItemKeys] = useState<string[]>([])
    const hasInitializedSelection = useRef(false)
    const [form, setForm] = useState<CheckoutFormState>({
        customerName: '',
        phoneNumber: '',
        address: '',
        note: '',
    })

    useEffect(() => {
        const keys = cartItems.map((item) => getCartItemKey(item.productId, item.size))

        setSelectedItemKeys((prev) => {
            if (!hasInitializedSelection.current) {
                hasInitializedSelection.current = true
                return keys
            }

            const keySet = new Set(keys)
            const validPrev = prev.filter((key) => keySet.has(key))
            const selectedSet = new Set(validPrev)
            const newKeys = keys.filter((key) => !selectedSet.has(key))
            return [...validPrev, ...newKeys]
        })
    }, [cartItems])

    const selectedKeySet = useMemo(() => new Set(selectedItemKeys), [selectedItemKeys])

    const selectedItems = useMemo(
        () => cartItems.filter((item) => selectedKeySet.has(getCartItemKey(item.productId, item.size))),
        [cartItems, selectedKeySet]
    )

    const selectedItemTypeCount = selectedItems.length
    const selectedQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0)
    const selectedTotal = selectedItems.reduce(
        (sum, item) => sum + item.productPrice * item.quantity,
        0
    )
    const isAllSelected = cartItems.length > 0 && selectedItemTypeCount === cartItems.length

    const toggleSelectItem = (productId: string, size: Size) => {
        const itemKey = getCartItemKey(productId, size)
        setSelectedItemKeys((prev) =>
            prev.includes(itemKey) ? prev.filter((key) => key !== itemKey) : [...prev, itemKey]
        )
    }

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedItemKeys([])
            return
        }
        setSelectedItemKeys(cartItems.map((item) => getCartItemKey(item.productId, item.size)))
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()

        const customerName = form.customerName.trim()
        const phoneNumber = form.phoneNumber.trim()
        const address = form.address.trim()
        const note = form.note.trim()

        if (!customerName || !phoneNumber || !address) {
            toast.error('Vui lòng nhập đầy đủ thông tin bắt buộc')
            return
        }

        if (!PHONE_REGEX.test(phoneNumber)) {
            toast.error('Số điện thoại không hợp lệ (10-11 số)')
            return
        }

        if (cartItems.length === 0) {
            toast.error('Giỏ hàng đang trống')
            return
        }

        if (selectedItems.length === 0) {
            toast.error('Vui lòng tick ít nhất 1 sản phẩm để đặt hàng')
            return
        }

        const checkoutItems = [...selectedItems]
        const placedItems: Array<{ productId: string; size: Size }> = []

        setSubmitting(true)
        try {
            for (const item of checkoutItems) {
                await createOrder({
                    customerName,
                    phoneNumber,
                    address,
                    note,
                    productId: item.productId,
                    size: item.size,
                    quantity: item.quantity,
                })

                placedItems.push({ productId: item.productId, size: item.size })
            }

            placedItems.forEach((item) => removeFromCart(item.productId, item.size))

            if (checkoutItems.length === cartItems.length) {
                setOrderSuccess(true)
                toast.success('Đặt hàng thành công!')
            } else {
                toast.success(`Đặt thành công ${checkoutItems.length} sản phẩm đã chọn`)
            }
        } catch (err) {
            if (placedItems.length > 0) {
                placedItems.forEach((item) => removeFromCart(item.productId, item.size))
            }

            const detail = err instanceof Error ? err.message : 'Lỗi không xác định'
            if (placedItems.length > 0) {
                toast.error(
                    `Đã tạo ${placedItems.length}/${checkoutItems.length} đơn. Các sản phẩm còn lại vẫn ở trong giỏ. (${detail})`
                )
            } else {
                toast.error(detail)
            }
        } finally {
            setSubmitting(false)
        }
    }

    if (orderSuccess) {
        return (
            <>
                <Header />
                <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                    <div className="bg-white border border-gray-200 rounded-2xl p-8">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Đặt hàng thành công!</h1>
                        <p className="text-gray-500 mb-6">Shop đã nhận đơn của bạn. Chúng tôi sẽ liên hệ sớm nhất có thể.</p>
                        <Link href="/" className="btn-primary inline-block">
                            Tiếp tục mua sắm
                        </Link>
                    </div>
                </main>
            </>
        )
    }

    return (
        <>
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Giỏ hàng</h1>
                        <p className="text-gray-500 text-sm mt-0.5">{cartCount} sản phẩm trong giỏ</p>
                    </div>
                    {cartItems.length > 0 && (
                        <button
                            type="button"
                            onClick={clearCart}
                            disabled={submitting}
                            className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                            Xóa toàn bộ
                        </button>
                    )}
                </div>

                {cartItems.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
                        <div className="text-5xl mb-4">🛒</div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Giỏ hàng đang trống</h2>
                        <p className="text-gray-500 mb-6">Thêm sản phẩm vào giỏ để đặt nhiều loại trong cùng một lần mua.</p>
                        <Link href="/" className="btn-primary inline-block">
                            Xem sản phẩm
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <section className="lg:col-span-2 space-y-3">
                            <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between">
                                <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={toggleSelectAll}
                                        disabled={submitting || cartItems.length === 0}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    Chọn tất cả
                                </label>
                                <span className="text-xs text-gray-500">
                                    Đã chọn {selectedItemTypeCount}/{cartItems.length} loại
                                </span>
                            </div>

                            {cartItems.map((item) => (
                                <article
                                    key={`${item.productId}_${item.size}`}
                                    className={`bg-white rounded-xl border p-4 ${selectedKeySet.has(getCartItemKey(item.productId, item.size))
                                        ? 'border-blue-300'
                                        : 'border-gray-200'
                                        }`}
                                >
                                    <div className="flex gap-4">
                                        <label className="pt-1">
                                            <input
                                                type="checkbox"
                                                checked={selectedKeySet.has(getCartItemKey(item.productId, item.size))}
                                                onChange={() => toggleSelectItem(item.productId, item.size)}
                                                disabled={submitting}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </label>

                                        <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                                            <Image
                                                src={item.productImage}
                                                alt={item.productName}
                                                fill
                                                sizes="96px"
                                                className="object-cover"
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 line-clamp-2">{item.productName}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Size: {item.size}</p>
                                            <p className="text-sm font-bold text-blue-600 mt-1">
                                                {item.productPrice.toLocaleString('vi-VN')}₫
                                            </p>

                                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateCartQuantity(item.productId, item.size, item.quantity - 1)}
                                                        disabled={submitting || item.quantity <= 1}
                                                        className="w-8 h-8 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                                                    >
                                                        -
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={item.quantity}
                                                        onChange={(e) =>
                                                            updateCartQuantity(item.productId, item.size, parseInt(e.target.value, 10) || 1)
                                                        }
                                                        disabled={submitting}
                                                        className="w-14 h-8 text-center text-sm border-x border-gray-300 focus:outline-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => updateCartQuantity(item.productId, item.size, item.quantity + 1)}
                                                        disabled={submitting}
                                                        className="w-8 h-8 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => removeFromCart(item.productId, item.size)}
                                                    disabled={submitting}
                                                    className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </div>

                                        <div className="text-right text-sm font-semibold text-gray-900">
                                            {(item.productPrice * item.quantity).toLocaleString('vi-VN')}₫
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </section>

                        <aside className="bg-white rounded-2xl border border-gray-200 p-5 h-fit">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Thông tin đặt hàng</h2>

                            <div className="space-y-2 text-sm mb-4 pb-4 border-b border-gray-200">
                                <div className="flex justify-between text-gray-600">
                                    <span>Số loại đã chọn</span>
                                    <span>{selectedItemTypeCount}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Tổng số lượng đã chọn</span>
                                    <span>{selectedQuantity}</span>
                                </div>
                                <div className="flex justify-between text-base font-bold text-gray-900">
                                    <span>Tạm tính đã chọn</span>
                                    <span className="text-blue-600">{selectedTotal.toLocaleString('vi-VN')}₫</span>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Họ tên <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.customerName}
                                        onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                                        className="input-field"
                                        placeholder="Nguyễn Văn A"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Số điện thoại <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        pattern="[0-9]{10,11}"
                                        value={form.phoneNumber}
                                        onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                                        className="input-field"
                                        placeholder="0901234567"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Địa chỉ giao hàng <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        required
                                        value={form.address}
                                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                                        className="input-field resize-none"
                                        rows={2}
                                        placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                                    <textarea
                                        value={form.note}
                                        onChange={(e) => setForm({ ...form, note: e.target.value })}
                                        className="input-field resize-none"
                                        rows={3}
                                        maxLength={500}
                                        placeholder="Tên và số in áo, khung giờ nhận hàng, ..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting || selectedItemTypeCount === 0}
                                    className="btn-primary w-full py-3"
                                >
                                    {submitting
                                        ? 'Đang xử lý...'
                                        : `Đặt ${selectedItemTypeCount} sản phẩm đã tick`}
                                </button>
                            </form>
                        </aside>
                    </div>
                )}
            </main>
        </>
    )
}
