import { toast } from 'react-hot-toast';

function loadScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export async function displayRazorpay(options) {
  // Log environment variables for debugging
  console.log('Environment Variables:', {
    REACT_APP_RAZORPAY_KEY_ID: process.env.REACT_APP_RAZORPAY_KEY_ID,
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  });

  // Validate Razorpay key
  const razorpayKey = process.env.REACT_APP_RAZORPAY_KEY_ID;
  if (!razorpayKey || razorpayKey.trim() === '') {
    const errorMsg = 'Razorpay configuration error: REACT_APP_RAZORPAY_KEY_ID is missing or empty. Ensure it is set in the .env file in the root of your React project and the app is restarted (npm start) or rebuilt (npm run build).';
    console.error(errorMsg);
    toast.error(errorMsg);
    if (options.onFailure) options.onFailure(errorMsg);
    return;
  }

  const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');

  if (!res) {
    const errorMsg = 'Razorpay SDK failed to load. Please check your internet connection.';
    console.error(errorMsg);
    toast.error(errorMsg);
    if (options.onFailure) options.onFailure(errorMsg);
    return;
  }

  const paymentOptions = {
    key: razorpayKey,
    amount: options.amount,
    currency: 'INR',
    name: 'A M',
    description: options.description || 'Account Creation/Renewal',
    order_id: options.order_id,
    handler: function (response) {
      console.log('Razorpay payment response:', response);
      if (options.onSuccess) {
        options.onSuccess(response);
      }
    },
    prefill: {
      email: options.email,
    },
    theme: {
      color: '#3399cc',
    },
  };

  try {
    const paymentObject = new window.Razorpay(paymentOptions);
    paymentObject.on('payment.failed', function (response) {
      const errorMsg = response.error?.description || 'Payment failed due to an unknown error';
      console.error('Razorpay payment failed:', response.error);
      toast.error(`Payment failed: ${errorMsg}`);
      if (options.onFailure) options.onFailure(errorMsg);
    });

    paymentObject.open();
  } catch (error) {
    const errorMsg = 'Razorpay initialization failed. Please try again.';
    console.error(errorMsg, error);
    toast.error(errorMsg);
    if (options.onFailure) options.onFailure(errorMsg);
  }
}