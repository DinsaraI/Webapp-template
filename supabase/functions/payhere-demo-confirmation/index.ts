import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { ...corsHeaders, 'Content-Type': 'application/json' },
	});
}

function isOrderItem(item: unknown): item is {
	productId: string;
	quantity: number;
	size?: string | null;
	sizeSystem?: 'US' | 'UK' | null;
} {
	return typeof item === 'object'
		&& item !== null
		&& !Array.isArray(item)
		&& 'productId' in item
		&& typeof item.productId === 'string'
		&& 'quantity' in item
		&& typeof item.quantity === 'number'
		&& (!('size' in item) || item.size === null || typeof item.size === 'string')
		&& (!('sizeSystem' in item) || item.sizeSystem === null || item.sizeSystem === 'US' || item.sizeSystem === 'UK');
}

Deno.serve(async (request: Request) => {
	if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
	if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);

	if (Deno.env.get('PAYHERE_DEMO_MODE') === 'false') {
		return jsonResponse({ error: 'PayHere is not configured. No payment was confirmed.' }, 503);
	}

	const supabaseUrl = Deno.env.get('SUPABASE_URL');
	const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
	const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
	if (!supabaseUrl || !anonKey || !serviceRoleKey) return jsonResponse({ error: 'Payment confirmation is not configured.' }, 500);

	const authorization = request.headers.get('Authorization');
	if (!authorization?.startsWith('Bearer ')) return jsonResponse({ error: 'Authentication is required.' }, 401);

	const userClient = createClient(supabaseUrl, anonKey, {
		global: { headers: { Authorization: authorization } },
	});
	const { data: { user }, error: userError } = await userClient.auth.getUser();
	if (userError || !user) return jsonResponse({ error: 'A valid signed-in session is required.' }, 401);

	let body: { amountInCents?: unknown; order?: unknown };
	try {
		body = await request.json();
	} catch {
		return jsonResponse({ error: 'A valid demo payment amount is required.' }, 400);
	}
	if (typeof body.amountInCents !== 'number' || !Number.isSafeInteger(body.amountInCents) || body.amountInCents <= 0) {
		return jsonResponse({ error: 'A valid demo payment amount is required.' }, 400);
	}

	if (typeof body.order !== 'object' || body.order === null || Array.isArray(body.order)) {
		return jsonResponse({ error: 'Valid order details are required.' }, 400);
	}
	const order = body.order as Record<string, unknown>;
	const requiredStrings = ['customerName', 'customerEmail', 'customerPhone'];
	if (requiredStrings.some((key) => typeof order[key] !== 'string')) {
		return jsonResponse({ error: 'Valid order details are required.' }, 400);
	}
	if (
		!Array.isArray(order.items)
		|| order.items.length === 0
		|| order.items.some((item: unknown) => !isOrderItem(item))
	) {
		return jsonResponse({ error: 'At least one order item is required.' }, 400);
	}
	const reference = `PAYHERE-DEMO-${crypto.randomUUID()}`;
	const adminClient = createClient(supabaseUrl, serviceRoleKey);
	const { data: createdOrders, error: orderError } = await adminClient.rpc('place_order', {
		p_user_id: user.id,
		p_customer_name: order.customerName,
		p_customer_email: order.customerEmail,
		p_customer_phone: order.customerPhone,
		p_shipping_address: order.shippingAddress,
		p_payment_amount_cents: body.amountInCents,
		p_items: order.items.map((item) => ({
			product_id: item.productId,
			quantity: item.quantity,
			size: item.size ?? null,
			size_system: item.sizeSystem ?? null,
		})),
		p_payment_reference: reference,
	});
	if (orderError) return jsonResponse({ error: orderError.message }, 400);
	const createdOrder = (createdOrders as { id: string; order_number: number }[] | null)?.[0];
	if (!createdOrder) return jsonResponse({ error: 'The confirmed demo order could not be created.' }, 500);

	return jsonResponse({
		paymentStatus: 'COMPLETE',
		paymentReference: reference,
		order: createdOrder,
		demoOnly: true,
	});
});
