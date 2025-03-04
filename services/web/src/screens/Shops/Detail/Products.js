import React from 'react';
import { Table, Message, Loader, Image, Button, Header } from 'semantic';
import { formatDateTime } from 'utils/date';
import { request } from 'utils/api';
import { screen } from 'helpers';
import { urlForUpload } from 'utils/uploads';
import { Layout, Confirm, HelpTip, SearchProvider } from 'components';

import Filters from 'modals/Filters';
import EditProduct from 'modals/EditProduct';

import Menu from './Menu';

@screen
export default class ShopProducts extends React.Component {
  onDataNeeded = async (params) => {
    const { shop } = this.props;
    return await request({
      method: 'POST',
      path: '/1/products/search',
      body: {
        ...params,
        shop: shop.id,
      },
    });
  };

  render() {
    const { shop } = this.props;
    return (
      <React.Fragment>
        <Menu {...this.props} />
        {shop ? (
          <SearchProvider onDataNeeded={this.onDataNeeded}>
            {({
              items: products,
              filters,
              setFilters,
              getSorted,
              setSort,
              reload,
            }) => {
              return (
                <React.Fragment>
                  <Layout horizontal center spread>
                    <Header as="h2">Products</Header>
                    <Layout.Group>
                      <Filters
                        size="small"
                        onSave={setFilters}
                        filters={filters}>
                        <Filters.Text
                          label="Search"
                          name="keyword"
                          placeholder="Enter name or product id"
                        />
                      </Filters>
                      <EditProduct
                        shop={shop}
                        onSave={reload}
                        trigger={
                          <Button
                            primary
                            size="small"
                            content="Add Product"
                            icon="plus"
                          />
                        }
                      />
                    </Layout.Group>
                  </Layout>
                  {products.length === 0 ? (
                    <Message>No products added yet</Message>
                  ) : (
                    <Table sortable celled>
                      <Table.Header>
                        <Table.Row>
                          {/* --- Generator: list-header-cells */}
                          <Table.HeaderCell width={2}>Image</Table.HeaderCell>
                          <Table.HeaderCell
                            width={3}
                            sorted={getSorted('name')}
                            onClick={() => setSort('name')}>
                            Name
                          </Table.HeaderCell>
                          <Table.HeaderCell width={3}>
                            Description
                          </Table.HeaderCell>
                          {/* --- Generator: end */}
                          <Table.HeaderCell
                            width={3}
                            sorted={getSorted('createdAt')}
                            onClick={() => setSort('createdAt')}>
                            Created
                            <HelpTip
                              title="Created"
                              text="This is the date and time the item was created."
                            />
                          </Table.HeaderCell>
                          <Table.HeaderCell textAlign="center">
                            Actions
                          </Table.HeaderCell>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {products.map((product) => {
                          return (
                            <Table.Row key={product.id}>
                              {/* --- Generator: list-body-cells */}
                              <Table.Cell>
                                {product.images[0] && (
                                  <Image
                                    style={{ width: '100%' }}
                                    src={urlForUpload(product.images[0])}
                                  />
                                )}
                              </Table.Cell>
                              <Table.Cell>{product.name}</Table.Cell>
                              <Table.Cell>{product.description}</Table.Cell>
                              {/* --- Generator: end */}
                              <Table.Cell>
                                {formatDateTime(product.createdAt)}
                              </Table.Cell>
                              <Table.Cell textAlign="center">
                                <EditProduct
                                  shop={shop}
                                  product={product}
                                  onSave={reload}
                                  trigger={<Button basic icon="edit" />}
                                />
                                <Confirm
                                  negative
                                  confirmText="Delete"
                                  header={`Are you sure you want to delete "${product.name}"?`}
                                  content="All data will be permanently deleted"
                                  trigger={<Button basic icon="trash" />}
                                  onConfirm={async () => {
                                    await request({
                                      method: 'DELETE',
                                      path: `/1/products/${product.id}`,
                                    });
                                    reload();
                                  }}
                                />
                              </Table.Cell>
                            </Table.Row>
                          );
                        })}
                      </Table.Body>
                    </Table>
                  )}
                </React.Fragment>
              );
            }}
          </SearchProvider>
        ) : (
          <Loader active>Loading</Loader>
        )}
      </React.Fragment>
    );
  }
}
