import {useParams} from 'react-router-dom';
import {useEffect, useState} from 'react';
import {defer, LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import {Aside} from '~/components/layout/Aside';
import {CartAside, CartToggle} from '~/components/header/CartHeader';
import {CartReturn, Image} from '@shopify/hydrogen';
import {AllCategories, CATEGORIES_QUERY} from './_index';

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
  const {category} = params;
  const [productsFromCategory, subCategories] = await Promise.all([
    context.storefront.query(PRODUCTS_FROM_CATEGORY, {
      variables: {query: `handle:${category}`},
    }),
    context.storefront.query(CATEGORIES_QUERY, {
      variables: {handle: category ?? 'hardware'},
    }),
  ]);
  return {productsFromCategory, subCategories};
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

const ProductsPage = () => {
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
        <AllCategories categories={data.subCategories} title={null} />

        {data.productsFromCategory.collections.nodes.map((collection) => {
          return (
            <>
              <h2>{collection.title}</h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 15,
                }}
              >
                {collection.products.nodes.map((product) => {
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
            </>
          );
        })}
      </div>
    </div>
  );
};

export default ProductsPage;

const PRODUCTS_FROM_CATEGORY = `#graphql
  query getProducts($query: String!) {
  collections(first: 10, query: $query) {
    nodes {
      title
      products(first: 30) {
        nodes {
          id
          title
          description
          handle
        }
      }
    }
  }
}`;
