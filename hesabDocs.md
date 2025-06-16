


 
HesabPay

    Home
    Payments
    Developer

    Documentation

    Logout

    Home
    Payment
    Developer

        - Get Started
        - Webhooks

Understanding Webhooks
What are Webhooks?

Webhooks are automated messages sent from apps when something happens. They have a message—or payload—and are sent to a unique URL. They're a simple way to extend and integrate different systems, allowing you to receive real-time data updates from a service or app. This makes them ideal for syncing data between systems or triggering actions based on events.
Why Use Webhooks?

Webhooks are incredibly useful for creating interactive and responsive applications. By utilizing webhooks, you can:

    Automate workflows and reduce manual work.
    Receive instant notifications of important events.
    Sync data between different systems in real-time.
    Build serverless applications that react to external events.

When integarting HesabPay as a payment gateway, you might want your applications to receive events as they occur in your HesabPay account, so that your backend systems can execute actions accordingly. To enable webhook events, you need to register webhook endpoints. After you register them, HesabPay can push real-time event data to your application’s webhook endpoint when events happen in your HesabPay account. HesabPay uses HTTPS to send webhook events to your app as a JSON payload that includes an Event object. Receiving webhook events are particularly useful for listening to asynchronous events such as when a customer pays you.
Setting Up a Webhook

Setting up a webhook typically involves specifying a URL in your system where the webhook provider will send HTTP requests. The provider may offer options to customize the payload format and the types of events you're interested in. It's important to secure your webhooks to prevent unauthorized access and data exposure.

To begin, the first step is to subscribe to an event. This step is essential as you provide an http endpoint where we can send you the payment data. Here's how you can subscribe to an event:
Access the webhooks management: Navigate to the Developer section in the dashboard and then click on the webhooks tab.
Add an HTTP endpoint: Follow the instructions to add an endpoint. Remember, this endpoint should be public and over Https so that we can call it and send you the payment data.
Security Tip: Use HTTPS for your endpoint, validate incoming requests and only process the requests with a valid signature.
Endpoint Details
Step 1: Create a public endpoint on your server to receive payment transaction details. Below is the format of the data you will receive from HesabPay for a successful payment transaction:

{
    "status_code": 10,
    "success": true,
    "message": "Operation successful",
    "sender_account": "793111222",
    "transaction_id": "0328379001707719668",
    "amount": 65,
    "memo": "random test memo",
    "signature": "d44ec5b76dcd5b367807f9b582b718a8b1971638ea72e017132281a8b70d6229",
    "timestamp": "1707719607",
    "transaction_date": "2024-02-12 11:04:28",
    "items": [
      {"id": "a96de629",name": "Item 1", "price": 45},   
      {"id": 12,name": "Item 2", "price": 20}
    ],
    "email": "abcd@example.com"
  }

Step 2: Validate the incoming request by verifying the originator (https://api.hesab.com).
Step 3: Verify the request signature by submitting the signature and timestamp from the request data to the endpoint:

https://api.hesab.com/api/v1/hesab/webhooks/verify-signature

Note: Include "HesabPay" in the Authorization header, followed by your API key.

Below is a sample response for a valid signature verification:

{
  "status_code": 10,
  "success": true,
  "message": "Signature is valid"
}

Code Snippet: Here is a Python sample code snippet for verifying the request signature.


  import requests
  import json
  
  # The API endpoint URL
  url = "https://api.hesab.com/api/v1/hesab/webhooks/verify-signature"
  
  # Your API key
  api_key = "your_api_key_here"
  
  # The data you wish to send in the request body
  data = {
      "signature": "signature_here",
      "timestamp": "timestamp_here",
  }
  
  # Set the Authorization header with your API key
  headers = {
      "Authorization": f"API-KEY {api_key}",
      "Content-Type": "application/json",  
  }
  
  # Make the POST request
  response = requests.post(url, headers=headers, data=json.dumps(data))

  data = response.json()
  
  # Check if the request was successful
  if response.status_code == 200 and data.get('success') == True:
      print("Success:", response.json())
  else:
      print("Error:", response.text)
  

Do not process the payment transaction until you've verified the signature. The signature will be valid if the success key in the response is equal to true.

Remember to test your webhooks thoroughly in a development environment before moving to production.

    About
    Privacy Policy
    contact us

ve 
HesabPay

    Home
    Payments
    Developer

    Documentation

    Logout

    Home
    Payment
    Developer

        - Get Started
        - Webhooks

Payment Integration
Step 1: Obtaining an API Key

To begin integrating HesabPay into your application, the first step is to obtain an API key. This key is essential as it authenticates and authorizes your application to interact with HesabPay's services. Here's how you can get your API key:
Access API Key Management: Navigate to the Developer section in the dashboard and then click on the API keys tab.
Generate API Key: Follow the instructions to generate a new API key. Remember, this key should be kept confidential and not exposed to the public.
Step 2: Creating a Payment Session

Once you have your API key, you can create a payment session. This involves sending a request to HesabPay's API endpoint with your API key and a list of items the user wishes to purchase.
Note: Make sure to append API-KEY in the Authorization header before your API key.

The request payload should have the following format:


  {
    "email": "abcd@example.com", // optional
    
    "items": [
        {"id": "a96de629",name": "Item 1", "price": 45},   
        {"id": 12,name": "Item 2", "price": 20}
    ]
  }
  

Code Snippet: Below are examples of how to create a payment session using Python, PHP, and Node.js:

import requests

def create_payment_session(api_key, items, email):
    endpoint = "https://api.hesab.com/api/v1/payment/create-session"
    headers = {
        "Authorization": f"API-KEY {api_key}",
        "accept": "application/json"
    }
    payload = {
        "items": items,
        "email": email
        
    }
    try:
        response = requests.post(endpoint, json=payload, headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"HTTP Error: {response.status_code}", "message": response.text}
    except requests.exceptions.RequestException as e:
        return {"error": "Request Exception", "message": str(e)}

Don't forget to replace your test API key with the production API key as the Authorization header when creating the session in production environment.
Step 3: Redirecting to Payment URL

After creating a payment session, you will receive a URL in response. This URL is where your users will complete their payment. You should redirect your users to this URL for payment processing.
Checkout Page:
HesabPay Checkout Page
Step 4: Handling the Post-Payment Process

After the payment process is successfully completed, users are redirected to a confirmation page as visual confirmation of transaction success. In addition, a custom event named paymentSuccess is emitted. This event carries crucial transaction details within its payload, including success (a boolean indicating the outcome), a descriptive message, and the transaction_id (a unique identifier for the transaction).

The paymentSuccess event is designed for cross-domain communication, making it crucial for integrators to understand how to securely capture and handle this information. Applications receiving this event can use it to trigger subsequent actions such as updating user accounts, logging transaction details, or initiating related processes.

Below, you'll find guidelines on how to listen for the paymentSuccess event using JavaScript's window.addEventListener or similar functions within your application's client-side scripting environment. Note that for security and functional effectiveness, it's vital to implement validation and error handling around the incoming data.

Example Code for Capturing the Event:


window.addEventListener('message', function(event) {
  if (event.origin !== 'http://expected-origin.com') {
    // Validate the event origin
    return;
  }
  if (event.data.type === 'paymentSuccess') {
    console.log('Payment successful:', event.data);
    // Handle the payment success, e.g., update UI, log to server
  }
});

It's crucial to include this script in a part of your application that remains active during the payment process to ensure the event is captured and handled correctly. Effective management of this event is key to enhancing user experience and ensuring the integrity and continuity of the transaction flow.
Supporting "Pay as Guest" Option

The "Pay as Guest" feature enables users without a HesabPay account to make payments using other payment methods. Users can select from options such as AfPay Card, Mastercard, Visa, American Express, Discover, JCD Express, or UnionPay
Implementation Details:

    1. API Updates: When initializing the payment session, include support for "Pay as Guest" options. The updated payload remains unchanged but provides additional methods on the checkout page.
    2. User Flow: If the user selects "Pay as Guest," they will be presented with various payment options to complete their transaction.
    3. HesabPay Checkout UI:
        i: The default "Pay" button is for HesabPay account holders.
        ii: The "Pay as Guest" button redirects users to select their preferred external payment method.

Distributing Payments to Multiple Vendors

The Vendor Payment Distribution API enables merchants who integrate our payment gateway into their e-commerce websites to distribute payment amounts to multiple vendors. This functionality is essential for multi-vendor marketplaces where items purchased by customers belong to different vendors. Using this API, merchants can seamlessly transfer the respective amounts to each vendor's account after a successful payment session

Use Case
After receiving a successful payment response from the create-session API (https://api-sandbox.hesab.com/api/v1/payment/create-session), merchants can use this API to allocate the total amount received among the vendors whose items were sold.

The payload for this API should include the merchant's PIN for authorization and a list of vendors with their account numbers and the respective amounts
Note: For security reason you should send you account pin in encrypted form we have provided method for pin encryption


  {
    
  "pin":"aVhMuXVLTSeITdwBls7ludX8MGU=" ,
  "vendors": [
    {"account_number": "0794825911", "amount": 20},
    {"account_number": "0794825001", "amount": 40},
    {"account_number": "0742825911", "amount": 20}
    ]
  }
  

  

Note: In multi-vendor transactions, duplicate receiver accounts are not permitted. Additionally, the maximum number of receivers is limited to 16, meaning you can send assets to up to 16 vendors at a time.
Code Snippet: Below are examples of how to create a payment session using Python, PHP, and Node.js:

import requests
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from Crypto.Random import get_random_bytes
import base64


def encrypt_data(data, key):
    key = key.encode('utf-8')[:32]
    key = key.ljust(32, b'  