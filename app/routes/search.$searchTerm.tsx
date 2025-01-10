import {Link, useLoaderData} from '@remix-run/react';
import {defer, LoaderFunctionArgs} from '@remix-run/server-runtime';

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
  const {searchTerm} = params;
  const [productsFromSearch] = await Promise.all([
    context.storefront.query(PRODUCTS_FROM_SEARCH, {
      variables: {query: searchTerm ?? ''},
    }),
  ]);
  return {productsFromSearch};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: LoaderFunctionArgs): {} {
  return {};
}

const FIXED_IMAGE_SIZE = 75;

const SearchPage = () => {
  const data = useLoaderData<typeof loader>();
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
          minWidth: '200px',
        }}
      />
      <div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 15,
          }}
        >
          {data.productsFromSearch.search.edges.map((productEdge) => {
            const product = productEdge.node;
            return (
              <Link key={product.id} to={`/product/${product.handle}`}>
                <div
                  style={{
                    width: '400px',
                    minHeight: '100px',
                    border: '1px solid grey',
                    padding: 3,
                  }}
                >
                  <span>{product.title}</span>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '75px 1fr',
                      gap: 10,
                    }}
                  >
                    <span style={{fontSize: 15}}>Image</span>
                    <span
                      style={{
                        fontSize: 12,
                      }}
                    >
                      {product.description.split('.')[0]}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;

const PRODUCTS_FROM_SEARCH = `#graphql
  query searchProducts($query: String!) {
  search(query: $query, first: 20, types: PRODUCT) {
    edges {
      node {
        ... on Product {
          id
          handle
          title
          description
        }
      }
    }
  }
}`;
