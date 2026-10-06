import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type OrderStatus =
	| 'Pending'
	| 'Paid'
	| 'Confirmed'
	| 'Processing'
	| 'Shipping'
	| 'Shipped'
	| 'Delivered'
	| 'Failed'
	| 'Declined'
	| 'Cancellation Pending'
	| 'Cancelled';

interface OrderRecord {
	id: string;
	order_number: number;
	customer_name: string;
	customer_email: string;
	customer_phone: string;
	status: OrderStatus;
	eta: string | null;
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { ...corsHeaders, 'Content-Type': 'application/json' },
	});
}

function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (character) => ({
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;',
	})[character] ?? character);
}

async function providerFailure(response: Response, provider: string): Promise<string> {
	let detail = '';
	try {
		const body: unknown = await response.clone().json();
		if (typeof body === 'object' && body !== null) {
			if ('message' in body && typeof body.message === 'string') {
				detail = body.message;
			}
			if ('code' in body && (typeof body.code === 'string' || typeof body.code === 'number')) {
				detail = `${detail}${detail ? ' ' : ''}(code ${body.code})`;
			}
		}
	} catch {
		detail = '';
	}

	const safeDetail = detail.replace(/[\r\n]+/g, ' ').slice(0, 300);
	return `${provider} provider returned HTTP ${response.status}${safeDetail ? `: ${safeDetail}` : ''}`;
}

function messageForStatus(status: OrderStatus, orderLabel: string, eta: string | null): string {
	switch (status) {
		case 'Processing':
		case 'Confirmed':
			return `${orderLabel} has been confirmed and is being prepared.${eta ? ` Estimated delivery: ${eta}.` : ''}`;
		case 'Paid':
			return `${orderLabel} payment has been received and the order is being prepared.${eta ? ` Estimated delivery: ${eta}.` : ''}`;
		case 'Shipping':
			return `${orderLabel} is being prepared for delivery.${eta ? ` Estimated delivery: ${eta}.` : ''}`;
		case 'Shipped':
			return `${orderLabel} has shipped.${eta ? ` Estimated delivery: ${eta}.` : ''}`;
		case 'Delivered':
			return `${orderLabel} has been delivered. Thank you for your order.`;
		case 'Failed':
		case 'Declined':
			return `${orderLabel} could not be completed. Please contact us if you need help.`;
		case 'Cancellation Pending':
			return `A cancellation was requested for ${orderLabel} and is awaiting review.`;
		case 'Cancelled':
			return `${orderLabel} has been cancelled. Please contact us if you need help.`;
		case 'Pending':
			return `${orderLabel} has been received and is awaiting confirmation.`;
	}
}

async function sendEmail(
	apiKey: string,
	from: string,
	to: string,
	orderLabel: string,
	customerName: string,
	message: string,
): Promise<Response> {
	const safeName = escapeHtml(customerName);
	const safeOrder = escapeHtml(orderLabel);
	const safeMessage = escapeHtml(message);
	return await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			from,
			to: [to],
			subject: `Order update: ${orderLabel}`,
			text: `Hello ${customerName},\n\n${message}`,
			html: `<p>Hello ${safeName},</p><p>${safeMessage}</p><p>Order: ${safeOrder}</p>`,
		}),
		signal: AbortSignal.timeout(15000),
	});
}

async function sendSms(
	accountSid: string,
	authToken: string,
	from: string,
	to: string,
	message: string,
): Promise<Response> {
	const body = new URLSearchParams({ From: from, To: to, Body: message });
	return await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
		method: 'POST',
		headers: {
			'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body,
		signal: AbortSignal.timeout(15000),
	});
}

Deno.serve(async (request: Request) => {
	if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
	if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);

	const supabaseUrl = Deno.env.get('SUPABASE_URL');
	const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
	const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
	const resendApiKey = Deno.env.get('RESEND_API_KEY');
	const emailFrom = Deno.env.get('EMAIL_FROM');
	const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
	const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
	const twilioFromNumber = Deno.env.get('TWILIO_FROM_NUMBER');

	if (!supabaseUrl || !anonKey || !serviceRoleKey || !resendApiKey || !emailFrom
		|| !twilioAccountSid || !twilioAuthToken || !twilioFromNumber) {
		return jsonResponse({ error: 'Order notification delivery is not configured.' }, 500);
	}

	const authorization = request.headers.get('Authorization');
	if (!authorization?.startsWith('Bearer ')) return jsonResponse({ error: 'Authentication is required.' }, 401);

	const userClient = createClient(supabaseUrl, anonKey, {
		global: { headers: { Authorization: authorization } },
	});
	const { data: { user }, error: userError } = await userClient.auth.getUser();
	if (userError || !user) return jsonResponse({ error: 'A valid signed-in session is required.' }, 401);

	const adminClient = createClient(supabaseUrl, serviceRoleKey);
	const { data: profile, error: profileError } = await adminClient
		.from('profiles')
		.select('role')
		.eq('id', user.id)
		.maybeSingle();
	if (profileError) return jsonResponse({ error: 'Could not verify admin permissions.' }, 500);
	if (profile?.role !== 'admin') return jsonResponse({ error: 'Admin access is required.' }, 403);

	let body: { orderId?: unknown };
	try {
		body = await request.json();
	} catch {
		return jsonResponse({ error: 'A valid order ID is required.' }, 400);
	}
	if (typeof body.orderId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.orderId)) {
		return jsonResponse({ error: 'A valid order ID is required.' }, 400);
	}

	const { data: order, error: orderError } = await adminClient
		.from('orders')
		.select('id, order_number, customer_name, customer_email, customer_phone, status, eta')
		.eq('id', body.orderId)
		.maybeSingle<OrderRecord>();
	if (orderError) return jsonResponse({ error: 'Could not load the order for notification.' }, 500);
	if (!order) return jsonResponse({ error: 'Order not found.' }, 404);

	const orderLabel = `ORD-${String(order.order_number).padStart(6, '0')}`;
	const message = messageForStatus(order.status, orderLabel, order.eta);
	const [emailResult, smsResult] = await Promise.allSettled([
		sendEmail(resendApiKey, emailFrom, order.customer_email, orderLabel, order.customer_name, message),
		sendSms(twilioAccountSid, twilioAuthToken, twilioFromNumber, order.customer_phone, message),
	]);
	const failures: string[] = [];
	if (emailResult.status === 'rejected') failures.push('email request failed');
	else if (!emailResult.value.ok) failures.push(await providerFailure(emailResult.value, 'Email'));
	if (smsResult.status === 'rejected') failures.push('SMS request failed');
	else if (!smsResult.value.ok) failures.push(await providerFailure(smsResult.value, 'SMS'));

	if (failures.length > 0) {
		return jsonResponse({ error: `${failures.join(' and ')}.` }, 502);
	}
	return jsonResponse({ delivered: true });
});
