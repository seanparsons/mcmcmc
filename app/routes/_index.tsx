import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Await, useLoaderData, Link, type MetaFunction} from '@remix-run/react';
import {Suspense} from 'react';
import {CartReturn, Image} from '@shopify/hydrogen';
import {Aside} from '~/components/layout/Aside';
import {CartAside, CartToggle} from '~/components/header/CartHeader';
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
  const [categories] = await Promise.all([
    context.storefront.query(CATEGORIES_QUERY),
  ]);

  return {categories};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: LoaderFunctionArgs): {
  cart: Promise<CartReturn | null>;
  isLoggedIn: Promise<boolean>;
} {
  const {customerAccount, cart} = context;

  return {
    cart: cart.get(),
    isLoggedIn: customerAccount.isLoggedIn(),
  };
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  return (
    <Aside.Provider>
      <CartAside cart={data.cart} />
      <div style={{padding: 15, display: 'flex', flexDirection: 'column'}}>
        <header
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 15,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h1>McMcMc</h1>
          <div style={{display: 'flex', flexDirection: 'row', gap: 15}}>
            <div>Sign In</div>
            <div>Search</div>
            <CartToggle cart={data.cart} />
          </div>
        </header>
        <main>
          <div style={{display: 'flex', flexDirection: 'row', gap: 15}}>
            <Categories categories={data.categories} />
            <div style={{borderLeft: '1px solid grey'}} />
            <AllCategories categories={data.categories} />
          </div>
        </main>
      </div>
    </Aside.Provider>
  );
}

const FIXED_IMAGE_SIZE = 75;

function tailName(name: string): string {
  const nameParts = name.split('>');
  return nameParts[nameParts.length - 1].trim();
}

function Categories({categories}: {categories: any}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 200,
        gap: 10,
      }}
    >
      <h2>Choose a Category</h2>
      <div style={{borderTop: '1px solid grey'}} />
      {categories.categories.tier1ChildCategories.references.nodes.map(
        (child) => {
          return (
            <Link key={child.id} to={`/products/${child.name.value}`}>
              {tailName(child.name.value)}
            </Link>
          );
        },
      )}
    </div>
  );
}

function Tier3Category({tier3Category}: any) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      <Image
        data={{url: tier3Category.image.reference.image.url}}
        aspectRatio="1/1"
        width={FIXED_IMAGE_SIZE}
        height={FIXED_IMAGE_SIZE}
        style={{filter: 'grayscale(100%)'}}
      />
      <h2>{tailName(tier3Category.name.value)}</h2>
    </div>
  );
}

function Tier2Category({tier2Category}: any) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width:
          tier2Category.tier3ChildCategories == null
            ? FIXED_IMAGE_SIZE
            : undefined,
      }}
    >
      <Link key={tier2Category.id} to={`/products/${tier2Category.name.value}`}>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          {tier2Category.tier3ChildCategories == null ? (
            <Image
              data={{url: tier2Category.image.reference.image.url}}
              aspectRatio="1/1"
              width={FIXED_IMAGE_SIZE}
              height={FIXED_IMAGE_SIZE}
              style={{filter: 'grayscale(100%)'}}
            />
          ) : null}
          <span style={{width: FIXED_IMAGE_SIZE, fontSize: 12}}>
            {tailName(tier2Category.name.value)}
          </span>
        </div>
      </Link>
      {tier2Category.tier3ChildCategories == null
        ? null
        : tier2Category.childCategories.references.nodes.map(
            (tier3Category) => {
              return <Tier3Category tier3Category={tier3Category} />;
            },
          )}
    </div>
  );
}

function Tier1Category({tier1Category}: any) {
  return (
    <div
      key={tier1Category.id}
      style={{display: 'flex', flexDirection: 'column', gap: 10}}
    >
      {tier1Category.tier2ChildCategories == null ? (
        <Image
          data={{url: tier1Category.image.reference.image.url}}
          aspectRatio="1/1"
          width={FIXED_IMAGE_SIZE}
          height={FIXED_IMAGE_SIZE}
          style={{filter: 'grayscale(100%)'}}
        />
      ) : null}
      <span>{tailName(tier1Category.name.value)}</span>
      <div
        style={{
          display: 'flex',
          gap: 10,
          flexDirection:
            tier1Category.tier2ChildCategories == null ||
            tier1Category.tier2ChildCategories.references.nodes.every(
              (tier2Category) => {
                return tier2Category.tier3ChildCategories == null;
              },
            )
              ? 'row'
              : 'column',
        }}
      >
        {tier1Category.tier2ChildCategories == null
          ? null
          : tier1Category.tier2ChildCategories.references.nodes.map(
              (tier2Category) => {
                return <Tier2Category tier2Category={tier2Category} />;
              },
            )}
      </div>
    </div>
  );
}

function AllCategories({categories}: {categories: any}) {
  return (
    <div>
      <h2>All Categories</h2>
      <div style={{borderTop: '1px solid grey'}} />
      <div style={{display: 'flex', flexDirection: 'column'}}>
        {categories
          ? categories.categories.tier1ChildCategories.references.nodes.map(
              (tier1Category) => {
                return <Tier1Category tier1Category={tier1Category} />;
              },
            )
          : null}
      </div>
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

const CATEGORIES_QUERY = `#graphql
  fragment CoreCategoryFields on Metaobject {
    id
    name: field(key: "name") {
      value
    }
    image: field(key: "image") {
      reference {
        ... on MediaImage {
          image {
            id
            url
          }
        }
      }
    }
  }

  fragment Tier2CategoryFields on Metaobject {
    ...CoreCategoryFields
  }

  fragment Tier1CategoryFields on Metaobject {
    ...CoreCategoryFields
    tier2ChildCategories: field(key: "children_categories") {
      references(first: 100) {
        nodes {
          ... on Metaobject {
            ...Tier2CategoryFields
          }    
        }
      }
    }
  }

  fragment HardwareCategoryFields on Metaobject {
    tier1ChildCategories: field(key: "children_categories") {
      references(first: 100) {
        nodes {
          ... on Metaobject {
            ...Tier1CategoryFields
          }    
        }
      }
    }
  }

  query getCollections {
    categories: metaobject(
      handle: {handle: "Hardware", type: "category_metaobject"}
    ) {
      ...HardwareCategoryFields
    }
  }
` as const;
