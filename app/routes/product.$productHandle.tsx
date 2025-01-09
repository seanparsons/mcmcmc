import type {LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {defer} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {Image} from '@shopify/hydrogen';
import {AddToCartButton} from '~/components/cart/AddToCartButton';
import {useAside} from '~/components/layout/Aside';

export async function loader(args: LoaderFunctionArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return defer({...deferredData, ...criticalData});
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */

async function loadCriticalData({context, params}: LoaderFunctionArgs) {
  const {productHandle} = params;
  if (!productHandle) {
    return {product: null};
  }
  const [product] = await Promise.all([
    context.storefront.query(PRODUCT_FROM_HANDLE, {
      variables: {handle: productHandle},
    }),
  ]);
  return {product};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: LoaderFunctionArgs): object {
  return {};
}

const FIXED_IMAGE_SIZE = 75;

const ProductPage = () => {
  const data = useLoaderData<typeof loader>();
  const {open} = useAside();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 15,
        gridTemplateColumns: '200px 1fr',
      }}
    >
      <div
        style={{
          backgroundColor: 'lightgrey',
          padding: 15,
          width: '200px',
        }}
      />
      <div>
        <h2>{data.product?.product?.title}</h2>
        <p>{data.product?.product?.description}</p>
        <div>
          {data.product?.product?.images?.nodes?.map((image) => {
            return (
              <Image
                key={image.url}
                data={{url: image.url}}
                width={FIXED_IMAGE_SIZE}
                height={FIXED_IMAGE_SIZE}
                style={{filter: 'grayscale(100%)'}}
              />
            );
          })}
        </div>
        <h4>Variants</h4>
        <table style={{display: 'table-header-group'}}>
          <thead>
            <td>Variant</td>
            <td>Price</td>
          </thead>
          <tbody>
            {data.product?.product?.variants?.nodes?.map((variant: any) => {
              return (
                <tr key={variant.id}>
                  <td>{variant.title}</td>
                  <td>
                    {parseFloat(variant.price.amount).toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td>
                    <AddToCartButton
                      disabled={!variant || !variant.availableForSale}
                      onClick={() => {
                        open('cart');
                      }}
                      lines={
                        variant
                          ? [
                              {
                                merchandiseId: variant.id,
                                quantity: 1,
                                selectedVariant: variant,
                              },
                            ]
                          : []
                      }
                    >
                      {variant?.availableForSale ? 'Add to cart' : 'Sold out'}
                    </AddToCartButton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductPage;

// copied all fields since it's not clear what's exactly needed
const PRODUCT_FROM_HANDLE = `#graphql
  query getProduct($handle: String!) {
    product(handle: $handle) {
      id
      title
      description
      images(first: 1) {
        nodes {
          url
        }
      }
      variants(first: 10) {
        nodes {
          availableForSale
          compareAtPrice {
            amount
            currencyCode
          }
          id
          image {
            __typename
            id
            url
            altText
            width
            height
          }
          price {
            amount
            currencyCode
          }
          product {
            title
            handle
          }
          selectedOptions {
            name
            value
          }
          sku
          title
          unitPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;
