import type {OptimisticCartLine} from '@shopify/hydrogen';
import {CartForm, Image, Money} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {Link} from '@remix-run/react';
import {useAside} from '../layout/Aside';
import type {
  CartLineUpdateInput,
  MoneyV2,
} from '@shopify/hydrogen/storefront-api-types';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from './CartMain';

// Price display component
const ItemPrice = ({
  price,
  compareAtPrice,
}: {
  price?: MoneyV2;
  compareAtPrice?: MoneyV2 | null;
}) => (
  <div className="price-container">
    {compareAtPrice ? (
      <div className="sale-price">
        {price && <Money data={price} />}
        <s>
          <Money data={compareAtPrice} />
        </s>
      </div>
    ) : price ? (
      <Money data={price} />
    ) : (
      <span>&nbsp;</span>
    )}
  </div>
);

// Quantity controls component
const QuantityControls = ({
  lineId,
  quantity,
  isOptimistic,
}: {
  lineId: string;
  quantity: number;
  isOptimistic?: boolean;
}) => {
  const decrementQty = Number(Math.max(0, quantity - 1).toFixed(0));
  const incrementQty = Number((quantity + 1).toFixed(0));

  return (
    <div className="quantity-controls">
      <small>Qty: {quantity}</small>
      <div className="button-group">
        <UpdateQuantityButton lines={[{id: lineId, quantity: decrementQty}]}>
          <button
            disabled={quantity <= 1 || !!isOptimistic}
            name="decrement"
            value={decrementQty}
            aria-label="Reduce quantity"
          >
            −
          </button>
        </UpdateQuantityButton>

        <UpdateQuantityButton lines={[{id: lineId, quantity: incrementQty}]}>
          <button
            disabled={!!isOptimistic}
            name="increment"
            value={incrementQty}
            aria-label="Increase quantity"
          >
            +
          </button>
        </UpdateQuantityButton>

        <DeleteItemButton lineId={lineId} isDisabled={!!isOptimistic} />
      </div>
    </div>
  );
};

// Update quantity form wrapper
const UpdateQuantityButton = ({
  children,
  lines,
}: {
  children: React.ReactNode;
  lines: CartLineUpdateInput[];
}) => (
  <CartForm
    route="/cart"
    action={CartForm.ACTIONS.LinesUpdate}
    inputs={{lines}}
  >
    {children}
  </CartForm>
);

// Delete button component
const DeleteItemButton = ({
  lineId,
  isDisabled,
}: {
  lineId: string;
  isDisabled: boolean;
}) => (
  <CartForm
    route="/cart"
    action={CartForm.ACTIONS.LinesRemove}
    inputs={{lineIds: [lineId]}}
  >
    <button type="submit" disabled={isDisabled}>
      Delete
    </button>
  </CartForm>
);

// Main cart item component
export function ShoppingCartItem({
  layout,
  line,
}: {
  layout: CartLayout;
  line: OptimisticCartLine<CartApiQueryFragment>;
}) {
  const {id, merchandise} = line;
  const {product, title, image, selectedOptions} = merchandise;
  const variantUrl = useVariantUrl(product.handle, selectedOptions);
  const {close} = useAside();

  return (
    <li key={id} className="cart-item">
      <div className="item-content">
        {image && (
          <div className="item-image">
            <Image
              alt={title}
              aspectRatio="1/1"
              data={image}
              height={100}
              width={100}
              loading="lazy"
            />
          </div>
        )}

        <div className="item-details">
          <Link
            to={variantUrl}
            prefetch="intent"
            onClick={() => layout === 'aside' && close()}
          >
            <h3>{product.title}</h3>
          </Link>

          <ItemPrice price={line?.cost?.totalAmount} />

          <div className="variant-options">
            {selectedOptions.map(({name, value}) => (
              <span key={name} className="option">
                {name}: {value}
              </span>
            ))}
          </div>

          <QuantityControls
            lineId={id}
            quantity={line.quantity}
            isOptimistic={line.isOptimistic}
          />
        </div>
      </div>
    </li>
  );
}

export {ItemPrice as ProductPrice};
