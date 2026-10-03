const CHECKOUT_REDIRECT_KEY = 'a2w_auth_redirect_v1';

export function setCheckoutRedirect(): void {
  localStorage.setItem(CHECKOUT_REDIRECT_KEY, '/checkout');
}

export function hasCheckoutRedirect(): boolean {
  return localStorage.getItem(CHECKOUT_REDIRECT_KEY) === '/checkout';
}

export function consumeCheckoutRedirect(): string | null {
  const destination = localStorage.getItem(CHECKOUT_REDIRECT_KEY);
  localStorage.removeItem(CHECKOUT_REDIRECT_KEY);
  return destination === '/checkout' ? destination : null;
}
