Hesab payment creation request: {
  items: [
    {
      name: 'کرم ضد جوش ژیناژن تینت پوست مدل Tinted حجم 35 میلی لیتر ',
      price: 1,
      quantity: 1,
      product_id: '1b5bdbf5-d6b7-4a86-b123-01a6e85c6bbc'
    }
  ],
  shipping_info: {
    full_name: '1',
    phone_number: '1',
    address: '1',
    city: '1',
    state: null,
    zip_code: '1'
  },
  customer_email: 'customer@example.com',
  total_amount: 1
}
Authenticated user found: a4f629b4...
Cart data fetched successfully: {
  cart_id: 'ba59bc19-4000-45af-8d50-fedadf7871b5',
  items_count: 1,
  user_id: 'a4f629b4...'
}
Shipping address prepared: { full_name: '1', city: '1' }
Creating temp order: {
  temp_order_ref: 'TEMP-1750088385172-g8znc2y32',
  customer_email: 'customer@example.com',
  user_id: 'a4f629b4...',
  total_amount: 1,
  items_count: 1,
  has_cart_data: true,
  has_shipping_address: true
}
Temp order created successfully: {
  id: '181c9f91-5e41-4dee-add1-5276754145f9',
  temp_order_ref: 'TEMP-1750088385172-g8znc2y32',
  customer_email: 'customer@example.com',
  user_id: 'a4f629b4...',
  has_cart_data: true,
  has_shipping_address: true
}
Temporary order created: TEMP-1750088385172-g8znc2y32
Converted items for Hesab: [
  {
    id: '1b5bdbf5-d6b7-4a86-b123-01a6e85c6bbc',
    name: 'کرم ضد جوش ژیناژن تینت پوست مدل Tinted حجم 35 میلی لیتر ',
    price: 1,
    quantity: 1
  }
]
Including temp order reference in HesabPay request: TEMP-1750088385172-g8znc2y32
Creating Hesab payment session with official API structure
Endpoint: https://api.hesab.com/api/v1/payment/create-session
Payment data: {
  items: [
    {
      id: '1b5bdbf5-d6b7-4a86-b123-01a6e85c6bbc',
      name: 'کرم ضد جوش ژیناژن تینت پوست مدل Tinted حجم 35 میلی لیتر ',
      price: 1,
      quantity: 1
    }
  ],
  email: 'customer@example.com',
  order_id: 'TEMP-17500...'
}
Request headers: {
  Authorization: 'API-KEY ZTNlMWUyNm...',
  accept: 'application/json',
  'Content-Type': 'application/json'
}
Request payload: {
  items: [
    {
      id: '1b5bdbf5-d6b7-4a86-b123-01a6e85c6bbc',
      name: 'کرم ضد جوش ژیناژن تینت پوست مدل Tinted حجم 35 میلی لیتر ',
      price: 1,
      quantity: 1
    }
  ],
  email: 'customer@example.com',
  order_id: 'TEMP-17500...'
}
Response status: 200
Response headers: {
  allow: 'POST, OPTIONS',
  'alt-svc': 'h3=":443"; ma=86400',
  'cf-cache-status': 'DYNAMIC',
  'cf-ray': '950b66ea4a882929-EVN',
  connection: 'keep-alive',
  'content-encoding': 'br',
  'content-type': 'application/json',
  'cross-origin-opener-policy': 'same-origin',
  date: 'Mon, 16 Jun 2025 15:39:50 GMT',
  'expect-ct': 'max-age=86400, enforce',
  nel: '{"success_fraction":0,"report_to":"cf-nel","max_age":604800}',
  'referrer-policy': 'same-origin',
  'report-to': '{"endpoints":[{"url":"https:\\/\\/a.nel.cloudflare.com\\/report\\/v4?s=PwXTNPjFPK3X1STrQeU3Lcj6utK9%2B2s0%2Fyjl5h2nRGdqL%2FA7QZBmdK4n4KmE%2FPAowdPQ9wcv3s1Fw431O8mxc%2FtmlMx0GQsktI0w770L0mMbWmMEw6W9IzXX9VyDqJc%3D"}],"group":"cf-nel","max_age":604800}',
  server: 'cloudflare',
  'server-timing': 'cfL4;desc="?proto=TCP&rtt=89082&min_rtt=69874&rtt_var=36878&sent=4&recv=6&lost=0&retrans=0&sent_bytes=2817&recv_bytes=1103&delivery_rate=41181&cwnd=251&unsent_bytes=0&cid=83b736acc8b2990e&ts=2673&x=0"',
  'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
  'transfer-encoding': 'chunked',
  vary: 'origin',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'SAMEORIGIN',
  'x-xss-protection': '1; mode=block'
}
Raw response: {"url":"https://developers.hesab.com/checkout/30289e47-69ea-45b9-8ca8-66320bb8634a?data=Z0FBQUFBQm9VRG40YkVILW9ZV3plRms5NXhQVVNvMTJIYXpvTHJBZWktbklCWkhHTlhfRVgyMlVPX2U2N0hEYkNEb2NZTnY2T1dESVlwZmxlZmhud3JBdjV1LTFYZy1xaHozc095SDNvaGMwNDZvQ010QXNWWHhaNEl5S0gxQmlyNzhydXg1TUVtdVJ6UXRjQmRoTlFwSFdpVXo5U0xnRnhaZTJZaTl1MWRLbTJjMGw1bzduTlFoNGFscDVNcVVYTUJIeWpYZmFxRWhnUUEwY2ZmNlA5OHh6TkFIWUZFVVBtakk2OFc3UmFReVBPUHcyWWJscUJUeEJQaGZiMFZzV2xTdk4wZ3ZKV05raXRHdDllZFg3Zk1GZVhyUnZSVnVaWVZhSmxnTVRGVFRMd2pyTHRxanRROEJBVnRnSGJHZ1ZPbU9LcURMR21aZjFVMjIwMGpVSHcwS01qWUl2TWVjSy14V2ZSVGZGT3AxbUIwZzFMNjBBandoc0NYTU1HcExqM2cyY0NLRWtSdDd5b2p5YVRob1VNc2lQd2M1Z1JXeTdlTFpRR09aWUZDVTZTOTdCaXM4dHNLRUxZdkljeVI0RFJFVkUyR0NuQ1FzSzZLakV2eHhham5QQm1JZWhudHNvTWZRaTd6cS1KdTVzRUZCZ1FYWk13dHNfaVpfLXFCdHRQUF9LMmtyTTVpalNXMTg4U3JXRXlhT3RHYXhpMUFTQ295RW9JbzFxZl8tek12QUhycEdIZ1doTWx2RGMzMWY0TWtXTmFWRTM4RzhrVnlIUmVIUWU3RURGYzFJLUFMN2xKb1hrV3Z6QTY3Zi1LLWF3ZU1tTG8yM1JnMzJ0em1nOVdLZVRTWHFfdFBnem4xcVotYjNoN0QycnpLa1l5SEVQT3NuX2M1X0dqay1KSDVCMW8xU1JkYzUxZUQ2VmpEX0tfQjhlWnE3dC04enIycFVvQWRfcUpxaXRUX2RONVg0dzFsMzE1aDA4ZDBVT0VCQnVnQTR6VUtqUHQyakctTXFyWElEeHpJbkVZcmdZ"}
Payment session created successfully: {
  url: 'https://developers.hesab.com/checkout/30289e47-69ea-45b9-8ca8-66320bb8634a?data=Z0FBQUFBQm9VRG40YkVILW9ZV3plRms5NXhQVVNvMTJIYXpvTHJBZWktbklCWkhHTlhfRVgyMlVPX2U2N0hEYkNEb2NZTnY2T1dESVlwZmxlZmhud3JBdjV1LTFYZy1xaHozc095SDNvaGMwNDZvQ010QXNWWHhaNEl5S0gxQmlyNzhydXg1TUVtdVJ6UXRjQmRoTlFwSFdpVXo5U0xnRnhaZTJZaTl1MWRLbTJjMGw1bzduTlFoNGFscDVNcVVYTUJIeWpYZmFxRWhnUUEwY2ZmNlA5OHh6TkFIWUZFVVBtakk2OFc3UmFReVBPUHcyWWJscUJUeEJQaGZiMFZzV2xTdk4wZ3ZKV05raXRHdDllZFg3Zk1GZVhyUnZSVnVaWVZhSmxnTVRGVFRMd2pyTHRxanRROEJBVnRnSGJHZ1ZPbU9LcURMR21aZjFVMjIwMGpVSHcwS01qWUl2TWVjSy14V2ZSVGZGT3AxbUIwZzFMNjBBandoc0NYTU1HcExqM2cyY0NLRWtSdDd5b2p5YVRob1VNc2lQd2M1Z1JXeTdlTFpRR09aWUZDVTZTOTdCaXM4dHNLRUxZdkljeVI0RFJFVkUyR0NuQ1FzSzZLakV2eHhham5QQm1JZWhudHNvTWZRaTd6cS1KdTVzRUZCZ1FYWk13dHNfaVpfLXFCdHRQUF9LMmtyTTVpalNXMTg4U3JXRXlhT3RHYXhpMUFTQ295RW9JbzFxZl8tek12QUhycEdIZ1doTWx2RGMzMWY0TWtXTmFWRTM4RzhrVnlIUmVIUWU3RURGYzFJLUFMN2xKb1hrV3Z6QTY3Zi1LLWF3ZU1tTG8yM1JnMzJ0em1nOVdLZVRTWHFfdFBnem4xcVotYjNoN0QycnpLa1l5SEVQT3NuX2M1X0dqay1KSDVCMW8xU1JkYzUxZUQ2VmpEX0tfQjhlWnE3dC04enIycFVvQWRfcUpxaXRUX2RONVg0dzFsMzE1aDA4ZDBVT0VCQnVnQTR6VUtqUHQyakctTXFyWElEeHpJbkVZcmdZ'
}
Hesab payment result: {
  success: true,
  payment_url: 'https://developers.hesab.com/checkout/30289e47-69ea-45b9-8ca8-66320bb8634a?data=Z0FBQUFBQm9VRG40YkVILW9ZV3plRms5NXhQVVNvMTJIYXpvTHJBZWktbklCWkhHTlhfRVgyMlVPX2U2N0hEYkNEb2NZTnY2T1dESVlwZmxlZmhud3JBdjV1LTFYZy1xaHozc095SDNvaGMwNDZvQ010QXNWWHhaNEl5S0gxQmlyNzhydXg1TUVtdVJ6UXRjQmRoTlFwSFdpVXo5U0xnRnhaZTJZaTl1MWRLbTJjMGw1bzduTlFoNGFscDVNcVVYTUJIeWpYZmFxRWhnUUEwY2ZmNlA5OHh6TkFIWUZFVVBtakk2OFc3UmFReVBPUHcyWWJscUJUeEJQaGZiMFZzV2xTdk4wZ3ZKV05raXRHdDllZFg3Zk1GZVhyUnZSVnVaWVZhSmxnTVRGVFRMd2pyTHRxanRROEJBVnRnSGJHZ1ZPbU9LcURMR21aZjFVMjIwMGpVSHcwS01qWUl2TWVjSy14V2ZSVGZGT3AxbUIwZzFMNjBBandoc0NYTU1HcExqM2cyY0NLRWtSdDd5b2p5YVRob1VNc2lQd2M1Z1JXeTdlTFpRR09aWUZDVTZTOTdCaXM4dHNLRUxZdkljeVI0RFJFVkUyR0NuQ1FzSzZLakV2eHhham5QQm1JZWhudHNvTWZRaTd6cS1KdTVzRUZCZ1FYWk13dHNfaVpfLXFCdHRQUF9LMmtyTTVpalNXMTg4U3JXRXlhT3RHYXhpMUFTQ295RW9JbzFxZl8tek12QUhycEdIZ1doTWx2RGMzMWY0TWtXTmFWRTM4RzhrVnlIUmVIUWU3RURGYzFJLUFMN2xKb1hrV3Z6QTY3Zi1LLWF3ZU1tTG8yM1JnMzJ0em1nOVdLZVRTWHFfdFBnem4xcVotYjNoN0QycnpLa1l5SEVQT3NuX2M1X0dqay1KSDVCMW8xU1JkYzUxZUQ2VmpEX0tfQjhlWnE3dC04enIycFVvQWRfcUpxaXRUX2RONVg0dzFsMzE1aDA4ZDBVT0VCQnVnQTR6VUtqUHQyakctTXFyWElEeHpJbkVZcmdZ',
  session_id: undefined,
  message: 'Payment session created successfully',
  temp_order_id: undefined , bak gorudugn gibi @https://nextjs-with-supabase-liart-mu.vercel.app/payment/success?data={%22success%22:true,%22message%22:%22Operation%20successful%22,%22transaction_id%22:%220804583001750088410%22} gelene kadar neler oluyor goruyorsun 