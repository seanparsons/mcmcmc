import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Await, useLoaderData, Link, type MetaFunction} from '@remix-run/react';
import {Suspense} from 'react';
import {Image, Money} from '@shopify/hydrogen';

export const meta: MetaFunction = () => {
  return [{title: 'Hydrogen | Home'}];
};

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
async function loadCriticalData({context}: LoaderFunctionArgs) {
  const [] = await Promise.all([]);

  return {};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: LoaderFunctionArgs) {
  const products = context.storefront.query(PRODUCTS_QUERY).catch((error) => {
    // Log query errors, but don't throw them so the page can still render
    console.error(error);
    return null;
  });

  return {
    products,
  };
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="home">
      <Products products={data.products} />
    </div>
  );
}

function Products({products}: {products: Promise<ProductsQuery | null>}) {
  return (
    <div>
      <h2>Products</h2>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {(response) => {
            console.log('response', response);
            return (
              <div style={{display: 'flex', flexDirection: 'row'}}>
                {response
                  ? response.collections.edges.map((collection) => {
                      console.log('collection', collection);
                      return (
                        <div key={collection.node.id}>
                          <h3>{collection.node.title}</h3>
                          <div
                            style={{display: 'flex', flexDirection: 'column'}}
                          >
                            {collection.node.products.edges.map((product) => {
                              return (
                                <Link
                                  key={product.node.id}
                                  to={`/products/${product.handle}`}
                                >
                                  <Image
                                    data={product.node.images.edges[0]?.node}
                                    aspectRatio="1/1"
                                    sizes="(min-width: 45em) 20vw, 50vw"
                                  />
                                  <h4>{product.node.title}</h4>
                                  <small>
                                    <Money
                                      data={
                                        product.node.priceRange.minVariantPrice
                                      }
                                    />
                                  </small>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  : null}
              </div>
            );
          }}
        </Await>
      </Suspense>
      <br />
    </div>
  );
}

const PRODUCTS_QUERY = `#graphql
  query getCollectionsWithProducts {
    collections(first: 10) {
      edges {
        node {
          id
          title
          products(first: 10) {
            edges {
              node {
                id
                title
                description
                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
                images(first: 1) {
                  edges {
                    node {
                      src
                      altText
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
` as const;
