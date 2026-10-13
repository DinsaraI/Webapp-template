# Order status email and SMS

The admin status-update flow invokes `send-order-status-notification` after saving each order status. The function verifies the caller's Supabase session and admin role, then sends the update to the email and phone number saved with the order. Shipped updates include the saved tracking number in both email and SMS. Delivery and cancellation are terminal order statuses.

## Configure and deploy

1. In Supabase project settings, enable/deploy Edge Functions with JWT verification enabled.
2. Set these function secrets in the Supabase dashboard or with `supabase secrets set`:
   - `RESEND_API_KEY`
   - `EMAIL_FROM` — a sender address verified with Resend
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_FROM_NUMBER` — a Twilio SMS-capable number
3. Deploy from the repository root with the Supabase CLI:

   ```sh
   supabase functions deploy send-order-status-notification
   ```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are supplied to deployed Supabase Edge Functions by the platform. Never put provider keys in frontend environment variables.

Phone numbers must be in a format accepted by the Twilio account, normally E.164 (for example, `+947XXXXXXXX` for Sri Lanka). The function attempts both channels and returns an error to the admin if either provider rejects delivery.

## PayHere demo confirmation

`payhere-demo-confirmation` is a clearly labeled mock for client previews. It checks that the caller is signed in, then returns a generated demo reference without contacting PayHere or charging money. Deploy it with:

```sh
supabase functions deploy payhere-demo-confirmation
```

The mock is enabled unless the function secret `PAYHERE_DEMO_MODE` is set to `false`. Disable it before production use. It is not PayHere verification: before accepting real payments, replace the mock with PayHere checkout creation and server-side notification/signature verification, and only create/mark an order paid after that verified provider confirmation.

Apply `supabase/schema.sql` to the project before deploying the updated frontend. The order RPC is restricted to the service role. The demo function creates the order after its mock confirmation, saves the demo payment reference, and sets the new order to `Paid`.
