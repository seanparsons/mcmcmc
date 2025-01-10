import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, Link, type MetaFunction} from '@remix-run/react';
import {Image} from '@shopify/hydrogen';
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
    context.storefront.query(CATEGORIES_QUERY, {
      variables: {handle: 'hardware'},
    }),
  ]);

  return {categories};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: LoaderFunctionArgs): {} {
  return {};
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div style={{display: 'flex', flexDirection: 'row', gap: 15}}>
      <Categories categories={data.categories} />
      <div style={{borderLeft: '1px solid grey'}} />
      <AllCategories categories={data.categories} title={'All Categories'} />
    </div>
  );
}

const FIXED_IMAGE_SIZE = 75;

function tailName(name: string): string {
  const nameParts = name.split('>');
  return nameParts[nameParts.length - 1].trim();
}

function getDescription(description: any): string | null {
  if (description == null) {
    return null;
  } else {
    const descriptionObject = JSON.parse(description.value);
    return descriptionObject?.children?.[0]?.children?.[0].value ?? null;
  }
}

export function Categories({categories}: {categories: any}) {
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
            <Link key={child.id} to={`/products/${child.handle}`}>
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
      <Link key={tier2Category.id} to={`/products/${tier2Category.handle}`}>
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
  const description = getDescription(tier1Category.description);
  return (
    <div
      data-testid="tier1-category"
      key={tier1Category.id}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: 'fit-content',
      }}
    >
      {tier1Category.tier2ChildCategories == null ? (
        <Link to={`/products/${tier1Category.handle}`}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span>{tailName(tier1Category.name.value)}</span>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                width: '400px',
                minHeight: '100px',
                paddingTop: 10,
              }}
            >
              <Image
                data={{url: tier1Category.image.reference.image.url}}
                aspectRatio="1/1"
                width={FIXED_IMAGE_SIZE}
                height={FIXED_IMAGE_SIZE}
                style={{filter: 'grayscale(100%)'}}
              />
              {description == null ? null : (
                <span style={{fontSize: 12, padding: 2}}>{description}</span>
              )}
            </div>
          </div>
        </Link>
      ) : (
        <Link to={`/products/${tier1Category.handle}`}>
          <span>{tailName(tier1Category.name.value)}</span>
        </Link>
      )}
      <div
        data-testid="tier2-categories"
        style={{
          display: 'flex',
          gap: 10,
          flexFlow: 'row nowrap',
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

export function AllCategories({
  categories,
  title,
}: {
  categories: any;
  title: string | null;
}) {
  console.log('categories', categories);
  return (
    <div>
      {title == null ? null : (
        <>
          <h2>{title}</h2>
          <div style={{borderTop: '1px solid grey'}} />
        </>
      )}
      <div
        data-testid="all-categories"
        style={{
          display: 'flex',
          gap: 10,
          width: '80%',
          flexDirection:
            categories.categories.tier1ChildCategories == null ||
            categories.categories.tier1ChildCategories.references.nodes.every(
              (tier1Category) => {
                return tier1Category.tier3ChildCategories == null;
              },
            )
              ? 'row'
              : 'column',
          flexWrap: 'wrap',
        }}
      >
        {categories == null ||
        categories.categories.tier1ChildCategories == null
          ? null
          : categories.categories.tier1ChildCategories.references.nodes.map(
              (tier1Category) => {
                return <Tier1Category tier1Category={tier1Category} />;
              },
            )}
      </div>
      <br />
    </div>
  );
}

export const CATEGORIES_QUERY = `#graphql
  fragment CoreCategoryFields on Metaobject {
    id
    handle
    name: field(key: "name") {
      value
    }
    description: field(key: "description") {
      value
    }
    collection: field(key: "collection") {
      reference {
        ... on Collection {
          collectionHandle: handle
        }
      }
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

  query getCollections($handle: String!) {
    categories: metaobject(
      handle: {handle: $handle, type: "category_metaobject"}
    ) {
      ...HardwareCategoryFields
    }
  }
` as const;
