import {useAside, Aside} from '../layout/Aside';
import {useOptimisticCart} from '@shopify/hydrogen';
import {useAsyncValue, Await} from '@remix-run/react';
import {Suspense} from 'react';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {CartMain} from '../cart/CartMain';

export function CartAside({
  cart,
}: {
  cart: Promise<CartApiQueryFragment | null>;
}) {
  return (
    <Aside type="cart" heading="CART">
      <Suspense fallback={<p>Loading cart ...</p>}>
        <Await resolve={cart}>
          {(cart) => {
            return <CartMain cart={cart} layout="aside" />;
          }}
        </Await>
      </Suspense>
    </Aside>
  );
}

export function CartBadge({count}: {count: number | null}) {
  const {open} = useAside();

  return (
    <a
      href="/cart"
      onClick={(e) => {
        e.preventDefault();
        open('cart');
      }}
    >
      Cart {count === null ? <span>&nbsp;</span> : count}
    </a>
  );
}

export function CartToggle({
  cart,
}: {
  cart: Promise<CartApiQueryFragment | null>;
}) {
  return (
    <Suspense fallback={<CartBadge count={null} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

export function CartBanner() {
  const originalCart = useAsyncValue();
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}
